package net.scaraveos._3dfoo.server.gamelogic;

import com.restfb.Connection;
import com.restfb.DefaultFacebookClient;
import com.restfb.FacebookClient;
import com.restfb.Parameter;
import com.restfb.json.JsonObject;
import com.restfb.types.User;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import javolution.util.FastList;
import javolution.util.FastMap;
import net.scaraveos._3dfoo.server.models.Addon;
import net.scaraveos._3dfoo.server.models.Player;
import org.jwebsocket.api.WebSocketConnector;
import org.jwebsocket.server.TokenServer;
import org.jwebsocket.token.Token;
import org.jwebsocket.token.TokenFactory;
import twitter4j.IDs;
import twitter4j.ProfileImage;
import twitter4j.conf.ConfigurationBuilder;
import twitter4j.Twitter;
import twitter4j.TwitterException;
import twitter4j.TwitterFactory;

/**
 * The main game logic engine
 *
 * @author scaraveos
 */
public class Engine {
	// Network details
	private static final String
		TWITTER_CONSUMER_KEY = "";
	private static final String
		TWITTER_CONSUMER_SECRET = "";

	// Game statics
	private static final Double DAMAGE = 0.2;
	private static final Double TOP_HEALTH_PER_KILL = 3.00;
	private static final Integer POINTS_PER_KILL = 3;

	// Pools
	private FastMap<String, String> beams = null;
	private FastMap<String, Player> players = null;
	private FastMap<String, String> connectorToPlayer = null;
	private FastMap<String, FastMap<String, Object>> addonDefs = null;
	private FastMap<String, FastMap<String, Double>> addons = null;
	private FastMap<String, HashMap<String, Double>> playerUpdates = null;

	// Other
	private Long healthTimer = null;

	// Server
	private TokenServer tokenServer = null;

	/**
	 * Constructor
	 */
	public Engine(TokenServer tokenServer) {
		this.addonDefs = Addon.buildDefMapFromXml("conf/addon-definitions.xml");
		this.addons = new FastMap<String, FastMap<String, Double>>();
		this.players = new FastMap<String, Player>();
		this.connectorToPlayer = new FastMap<String, String>();
		this.playerUpdates = new FastMap<String, HashMap<String, Double>>();
		this.beams = new FastMap<String, String>();

		this.healthTimer = new Date().getTime();

		this.tokenServer = tokenServer;
	}

	public String getPlayerIdByConnectorId(String connectorId) {
		return this.connectorToPlayer.get(connectorId);
	}

	/**
	 * Inserts or updates player in the player pool
	 */
	public void setInsertPlayer(String oauthNetwork, String oauthToken, String oauthTokenSecret, WebSocketConnector connector) {
		String id = "";
		String name = "";
		String picture = "";
		FastList<String> friends = new FastList<String>();

		if (oauthNetwork.equals("twitter")) {
			ConfigurationBuilder cb = new ConfigurationBuilder();
			cb.setDebugEnabled(true)
				.setOAuthConsumerKey(Engine.TWITTER_CONSUMER_KEY)
				.setOAuthConsumerSecret(Engine.TWITTER_CONSUMER_SECRET)
				.setOAuthAccessToken(oauthToken)
				.setOAuthAccessTokenSecret(oauthTokenSecret);
			TwitterFactory tf = new TwitterFactory(cb.build());
			Twitter twitter = tf.getInstance();

			IDs friendTmp;
			try {
				long cursor = -1;
				friendTmp = twitter.getFriendsIDs(cursor);
				for (long friendId : friendTmp.getIDs()) {
					friends.add(String.valueOf(friendId));
				}

				twitter4j.User user = twitter.verifyCredentials();
				id = String.valueOf(user.getId());
				name = user.getScreenName();

				picture = twitter.getProfileImage(name, ProfileImage.NORMAL).getURL();
			} catch (TwitterException e) {
				// TODO: return error to client
			}
		} else if (oauthNetwork.equals("facebook")) {
			FacebookClient facebookClient = new DefaultFacebookClient(oauthToken);

			try {
				com.restfb.types.User user =
					facebookClient.fetchObject("me", com.restfb.types.User.class);
				id = user.getId();
				name = user.getUsername();

				JsonObject jsonObject = facebookClient.fetchObject("me", JsonObject.class, Parameter.with("fields", "picture"));
				picture = jsonObject.getString("picture");

				Connection<User> friendsTmp =
					facebookClient.fetchConnection("me/friends", com.restfb.types.User.class,
					Parameter.with("locale", "en_US"), Parameter.with("fields", "id"));

				for(com.restfb.types.User friendId : friendsTmp.getData()) {
					friends.add(friendId.getId());
				}
			} catch (Exception ignored) {

			}
		}

		// Try to insert the player to the player pool
		Player player = this.players.putIfAbsent(
			id,
			new Player(connector.getId(), id, name, picture, friends, new Date().getTime()));

		// If player already exists, update entry
		if (player != null) {
			player.setConnectorId(connector.getId());
			player.setId(id);
			player.setName(name);
			player.setPicture(picture);
			player.setFriends(friends);
			player.setLogonTime(new Date().getTime());
			player.setLogoutTime(null);

			this.players.put(id, player);
		}

		this.connectorToPlayer.put(connector.getId(), id);

		this.sendDefs();
	}

	/**
	 * Updates player's log-on and logout timestamps on disconnect.
	 */
	public void setRemovePlayer(WebSocketConnector connector) {
		String connectorId = connector.getId();
		String id = this.connectorToPlayer.get(connectorId);

		Player player = this.players.get(id);

		if (player != null) {
			player.setLogonTime(null);
			player.setLogoutTime(new Date().getTime());

			this.players.put(id, player);

			this.playerUpdates.remove(id);
			this.connectorToPlayer.remove(connectorId);

			this.sendDefs();
		}
	}

	/**
	 * Updates player position and initiates damage/health/death/points resolution
	 */
	public void setUpdatePlayer(Map message, WebSocketConnector connector) {
		String connectorId = connector.getId();

		String id = this.connectorToPlayer.get(connectorId);
		String clickId = null;

		Player player = this.players.get(id);

		try {
			clickId = (String) message.get("clickId");

			Player clickedPlayer = this.players.get(clickId);

			// TODO: add check that the rotation of the player is -
			//	looking the clicked player
			// TODO: add check that the clicked player is not weak
			if (
				clickedPlayer.getHealth() > 0 && clickedPlayer.isOnline()
				&& player.getHealth() > 0 && player.isOnline()
			) {
				clickedPlayer.updateHealth(-1.00, Engine.DAMAGE);
				player.updateDamage(-1.00, Engine.DAMAGE, clickId);
				// TODO: see if clickedPlayer is already locked by an other player
				player.addLock(clickId);

				if (clickedPlayer.getHealth() <= 0) {
					clickedPlayer.setHealth(0.00);

					// TODO: see if clickedPlayer is in player's locks
					player.updatePoints(1, Engine.POINTS_PER_KILL);
					player.updateTopHealth(1.00, Engine.TOP_HEALTH_PER_KILL);

					// TODO: remove lock from the player that has locked the clickedPlayer
					player.removeLock(clickId);

					this.sendDefs();
				}

				this.players.put(player.getId(), player);
				this.players.put(clickedPlayer.getId(), clickedPlayer);

				this.beams.put(id, clickId);

				HashMap clickedPlayerPositionMap = this.playerUpdates.get(clickId);
				clickedPlayerPositionMap.put("health", clickedPlayer.getHealth());
				this.playerUpdates.put(clickId, clickedPlayerPositionMap);
			}
		} catch(Exception e) {
			this.beams.remove(id);
		}

		this.beams.put(id, clickId);

		message.remove("id");
		message.remove("clickId");

		// TODO: add movement validation
		this.playerUpdates.put(id, (HashMap) message);
	}

	/**
	 * Returns player's start position
	 * This is random generator currently
	 */
	public FastMap<String, Integer> getStartingPosition() {
		FastMap<String, Integer> startingPosition =
			new FastMap<String, Integer>();

		Random position = new Random();

		startingPosition.put("x", position.nextInt(8000) + 1 - 4000);
		startingPosition.put("y", position.nextInt(8000) + 1 - 4000);

		return startingPosition;
	}

	/**
	 * Returns online player static information
	 */
	public FastMap<String, FastMap<String, String>> getPlayerDefs(String id) {
		FastMap<String, FastMap<String, String>> playerDefs =
			new FastMap<String, FastMap<String, String>>();

		for (Player player : this.players.values()) {
			if (player.isOnline()) {
				FastMap<String, String> playerDefMap = player.toDefMap();

				if (player.getHealth() == 0) {
					playerDefMap.put("type", "ghost");
				} else if (this.players.get(id).getFriends().indexOf(player.getId()) != -1) {
					playerDefMap.put("type", "ally");
				} else {
					String id1 = id;
					String id2 = player.getId();

					Integer pointDiff =
						this.players.get(id2).getPoints() / this.players.get(id1).getPoints();

					if (pointDiff >= 0.7 || this.players.get(id1).getPoints() < 20) {
						playerDefMap.put("type", "foe");
					} else {
						playerDefMap.put("type", "weak");
					}
				}

				playerDefs.put(player.getId(), playerDefMap);
			}
		}

		return playerDefs;
	}

	/**
	 * Returns map with add-on definitions
	 */
	public FastMap<String, FastMap<String, Object>> getAddonDefs() {
		return this.addonDefs;
	}

	/**
	 * Returns player's update information
	 */
	public FastMap<String, Object> getPlayerUpdate(String id) {
		Player player = this.players.get(id);

		if (player != null) {
			return player.toUpdateMap(false);
		}

		return null;
	}

	/**
	 * Returns players' positions and health
	 */
	public FastMap<String, HashMap<String, Double>> getPlayerUpdates() {
		return this.playerUpdates;
	}

	/**
	 * Returns beams
	 */
	public FastMap<String, String> getBeams() {
		return this.beams;
	}

	/**
	 * Returns add-on positions
	 */
	public FastMap<String, FastMap<String, Double>> getAddonPositions() {
		return this.addons;
	}

	/**
	 * Generates the broadcast token
	 */
	public Token getBcastToken() {
		Token bcastToken =
			TokenFactory.createToken(
				PlugIn.NS_GAMELOGIC, "bcast");

		FastMap<String, Object> tokenMap = new FastMap<String, Object>();

		tokenMap.put("players", this.getPlayerUpdates());
		tokenMap.put("beams", this.getBeams());
		tokenMap.put("addons", this.getAddonPositions());

		bcastToken.setMap("message", tokenMap);

		return bcastToken;
	}

	/**
	 * Returns map of player update tokens
	 */
	public FastMap<String, Token> getPlayerTokens() {
		FastMap<String, Token> playerTokenMap = new FastMap<String, Token>();

		Boolean updateHealth = false;
		Long timeNow = new Date().getTime();
		if (timeNow - this.healthTimer >= 60000) {
			updateHealth = true;
			this.healthTimer = timeNow;
		}

		Boolean healthRegenerated = false;
		for (Player player : this.players.values()) {
			if (player.isOnline()) {
				Token playerToken =
					TokenFactory.createToken(
						PlugIn.NS_GAMELOGIC, "player");

				playerToken.setMap("message", this.getPlayerUpdate(player.getId()));

				playerTokenMap.put(player.getConnectorId(), playerToken);

				player.clearShortLifePools();
			}

			if (updateHealth && player.getHealth() <= 85) {
				healthRegenerated = true;
				player.updateHealth(1.0, 15.0);
			}
		}

		if (healthRegenerated) this.sendDefs();

		return playerTokenMap;
	}

	/**
	 * Returns the definitions and starting position token
	 */
	public Token getDefsToken(String id) {
		Token defsToken =
				TokenFactory.createToken(
					PlugIn.NS_GAMELOGIC, "defs");

		FastMap<String, FastMap> defsMap = new FastMap<String, FastMap>();

		defsMap.put("players", this.getPlayerDefs(id));
		defsMap.put("addons", this.getAddonDefs());
		defsMap.put("position", this.getStartingPosition());
		defsMap.put("me", this.players.get(id).toUpdateMap(true));

		defsToken.setMap("message", defsMap);

		return defsToken;
	}

	public void sendDefs() {
		for (Player eachPlayer : this.players.values()) {
			if (eachPlayer.isOnline()) {
				this.tokenServer.sendToken(
					this.tokenServer.getConnector(eachPlayer.getConnectorId()), 
					this.getDefsToken(eachPlayer.getId()));
			}
		}
	}
}
