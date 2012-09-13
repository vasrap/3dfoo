package net.scaraveos._3dfoo.server.gamelogic;

import javolution.util.FastMap;
import org.apache.log4j.Logger;
import org.jwebsocket.api.PluginConfiguration;
import org.jwebsocket.api.WebSocketConnector;
import org.jwebsocket.api.WebSocketEngine;
import org.jwebsocket.kit.CloseReason;
import org.jwebsocket.logging.Logging;
import org.jwebsocket.kit.PlugInResponse;
import org.jwebsocket.plugins.TokenPlugIn;
import org.jwebsocket.server.TokenServer;
import org.jwebsocket.token.Token;
import org.jwebsocket.token.TokenFactory;

import java.util.HashMap;

public class PlugIn extends TokenPlugIn {
	public final static String NS_GAMELOGIC = "net.scaraveos._3dfoo.server.gamelogic";

	private static Logger log = Logging.getLogger(PlugIn.class);
	private boolean streamsInitialized = false;
	private BcastStream bcastStream = null;
	private PlayerStream playerStream = null;
	public static Engine gameEngine = null;

	public PlugIn(PluginConfiguration aConfiguration) {
		super(aConfiguration);
		if (this.log.isDebugEnabled()) {
			this.log.debug("Instantiating game logic plug-in...");
		}

		this.setNamespace(NS_GAMELOGIC);
	}

	@Override
	public void processToken(PlugInResponse action, WebSocketConnector connector, Token token) {
		String type = token.getType();
		String NS = token.getNS();

		if (type != null && getNamespace().equals(NS)) {
			if (type.equals("register")) {
				this.registerConnector(connector, token);
			} else if (type.equals("unregister")) {
				this.unregisterConnector(connector, token);
			} else if (type.equals("insertPlayer")) {
				HashMap data = (HashMap) token.getMap().get("message");
				String network = (String) data.get("oauthNetwork");
				String oauthToken = (String) data.get("oauthToken");
				String oauthTokenSecret = (String)data.get("oauthTokenSecret");
				gameEngine.setInsertPlayer(network, oauthToken, oauthTokenSecret, connector);
			} else if (type.equals("updatePlayer")) {
				gameEngine.setUpdatePlayer((HashMap) token.getMap().get("message"), connector);
			} else if (type.equals("pong")) {
				this.getServer().sendToken(connector, token);
			} else if (type.equals("updateChat")) {
				FastMap message = (FastMap) token.getMap().get("message");

				String chatMessage = (String) message.get("message");

				Token bcastToken = TokenFactory.createToken(PlugIn.NS_GAMELOGIC, "chat");

				FastMap<String, String> tokenMap = new FastMap<String, String>();

				tokenMap.put("id", this.gameEngine.getPlayerIdByConnectorId(connector.getId()));
				tokenMap.put("message", chatMessage);

				bcastToken.setMap("message", tokenMap);

				this.broadcastToken(connector, bcastToken);
			}
		}
	}

	public void registerConnector(WebSocketConnector connector, Token token) {
		if (this.log.isDebugEnabled()) {
			this.log.debug("Processing 'register'...");
		}

		if (!this.bcastStream.isConnectorRegistered(connector)) {
			if (this.log.isDebugEnabled()) {
				this.log.debug("Registering client to stream...");
			}

			this.bcastStream.registerConnector(connector);
			this.playerStream.registerConnector(connector);
		}
	}

	public void unregisterConnector(WebSocketConnector connector, Token token) {
		if (this.log.isDebugEnabled()) {
			this.log.debug("Processing 'unregister'...");
		}

		if (this.bcastStream.isConnectorRegistered(connector)) {
			if (this.log.isDebugEnabled()) {
				this.log.debug("Unregistering client from stream...");
			}

			this.bcastStream.unregisterConnector(connector);
			this.playerStream.unregisterConnector(connector);

			gameEngine.setRemovePlayer(connector);
		}
	}

	@Override
	public void connectorStopped(WebSocketConnector connector, CloseReason closeReason) {
		try {
			this.bcastStream.unregisterConnector(connector);
			this.playerStream.unregisterConnector(connector);

			gameEngine.setRemovePlayer(connector);
		} catch (Exception e) {
			this.log.error(e.getClass().getSimpleName() + " on stopping connector: " + e.getMessage());
		}
	}

	private void startStream() {
		if (!this.streamsInitialized) {
			if (this.log.isDebugEnabled()) {
				this.log.debug("Starting stream...");
			}

			TokenServer tokenServer = this.getServer();
			if (tokenServer != null) {
				this.bcastStream = new BcastStream("gameBcastStream", tokenServer);
				this.playerStream = new PlayerStream("gamePlayerStream", tokenServer);

				this.streamsInitialized = true;
			}
		}
	}

	private void stopStream() {
		if (this.streamsInitialized) {
			if (this.log.isDebugEnabled()) {
				this.log.debug("Stopping stream...");
			}

			TokenServer tokenServer = this.getServer();
			if (tokenServer != null) {
				if (this.bcastStream != null) {
					this.bcastStream.stopStream(3000);
					this.playerStream.stopStream(3000);
				}

				this.bcastStream = null;
				this.playerStream = null;
			}
		}
	}

	@Override
	public void engineStarted(WebSocketEngine engine) {
		this.gameEngine = new Engine(this.getServer());
		this.startStream();
	}

	@Override
	public void engineStopped(WebSocketEngine engine) {
		this.stopStream();
	}
}