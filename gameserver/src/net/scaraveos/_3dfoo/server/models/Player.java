package net.scaraveos._3dfoo.server.models;

import java.text.DecimalFormat;
import java.util.Date;
import java.util.Map;
import javolution.util.FastList;
import javolution.util.FastMap;

/**
 * Player class
 * 
 * @author scaraveos
 */
public class Player {
	private String connectorId = "";
	private String id = "";
	private String name = "";
	private String picture = "";
	private FastList<String> friends = new FastList<String>();
	private Double health = 100.00;
	private Double topHealth = 100.00;
	private Integer points = 1;
	private FastMap addons = new FastMap();
	private FastMap<String, Double> damage = new FastMap<String, Double>();
	private FastMap<String, Long> locks = new FastMap<String, Long>();
	private Long logonTime = null;
	private Long logoutTime = null;

	public String getConnectorId() {
		return connectorId;
	}

	public void setConnectorId(String connectorId) {
		this.connectorId = connectorId;
	}

	public FastMap getAddons() {
		return addons;
	}

	public void setAddons(FastMap addons) {
		this.addons = addons;
	}

	public FastMap<String, Double> getDamage() {
		return damage;
	}

	public void setDamage(FastMap<String, Double> damage) {
		this.damage = damage;
	}

	public FastList<String> getFriends() {
		return friends;
	}

	public void setFriends(FastList<String> friends) {
		this.friends = friends;
	}

	public Double getHealth() {
		return health;
	}

	public void setHealth(Double health) {
		this.health = health;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public FastMap<String, Long> getLocks() {
		return locks;
	}

	public void setLocks(FastMap<String, Long> locks) {
		this.locks = locks;
	}

	public Long getLogonTime() {
		return logonTime;
	}

	public void setLogonTime(Long logonTime) {
		this.logonTime = logonTime;
	}

	public Long getLogoutTime() {
		return logoutTime;
	}

	public void setLogoutTime(Long logoutTime) {
		this.logoutTime = logoutTime;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getPicture() {
		return picture;
	}

	public void setPicture(String picture) {
		this.picture = picture;
	}

	public Integer getPoints() {
		return points;
	}

	public void setPoints(Integer points) {
		this.points = points;
	}

	public Double getTopHealth() {
		return topHealth;
	}

	public void setTopHealth(Double topHealth) {
		this.topHealth = topHealth;
	}

	public Player(String connectorId, String id, String name, String picture, 
			FastList friends, Long logonTime) {
		this.connectorId = connectorId;
		this.id = id;
		this.name = name;
		this.picture = picture;
		this.friends = friends;
		this.logonTime = logonTime;
	}

	/**
	 * Checks if player is online looking at the log-on time property.
	 * 
	 * @return 
	 */
	public boolean isOnline() {
		if (this.logonTime == null) {
			return false;
		}

		return true;
	}

	/**
	 * Returns player definition properties 
	 * 
	 * @return 
	 */
	public FastMap<String, String> toDefMap() {
		FastMap<String, String> defMap = new FastMap<String, String>();

		defMap.put("id", this.id);
		defMap.put("name", this.name);
		defMap.put("picture", this.picture);

		return defMap;
	}

	/**
	 * Returns player update properties
	 * 
	 * @return 
	 */
	public FastMap<String, Object> toUpdateMap(boolean me) {
		FastMap<String, Object> updateMap = new FastMap<String, Object>();

		if (me) {
			updateMap.put("id", this.id);
			updateMap.put("name", this.name);
			updateMap.put("picture", this.picture);
		} else {
			DecimalFormat twoDForm = new DecimalFormat("#.##");

			updateMap.put("health", Math.floor((Double) this.health));
			updateMap.put("topHealth", Math.floor((Double) this.topHealth));
			updateMap.put("points", this.points);
			updateMap.put("addons", this.addons);
			updateMap.put("damage", this.damage);
			updateMap.put("locks", this.locks);
		}

		return updateMap;
	}

	/**
	 * Updates points
	 * 
	 * @param factor
	 * @param value
	 */
	public void updatePoints(Integer factor, Integer value) {
		this.points = this.points + (factor * value);
	}

	/**
	 * Updates health
	 * 
	 * @param factor
	 * @param value
	 */
	public void updateHealth(Double factor, Double value) {
		this.health = this.health + (factor * value);
	}

	/**
	 * Updates top health
	 * 
	 * @param factor
	 * @param value
	 */
	public void updateTopHealth(Double factor, Double value) {
		this.topHealth = this.topHealth + (factor * value);
	}

	/**
	 * Updates damage
	 * 
	 * @param factor
	 * @param damage 
	 */
	public void updateDamage(Double factor, Double damage, String clickId) {
		Double previousDamage = this.damage.get(clickId);
		if (previousDamage == null) previousDamage = 0.00;

		Double newDamage = 
			(double) Math.round((previousDamage + (factor * damage)) * 100) / 100;

		this.damage.put(clickId, newDamage);
	}

	/**
	 * Adds a lock to the locks list
	 * 
	 * @param clickId 
	 */
	public void addLock(String clickId) {
		this.locks.put(clickId, new Date().getTime());
	}

	/**
	 * Clear pools that with short life span
	 * [connects, damage]
	 */
	private Long timeCheck = new Date().getTime();
	public void clearShortLifePools() {		
		Long timeNow = new Date().getTime();

		if (timeNow - this.timeCheck > 1000) {
			this.damage.clear();
		}

		// Delete locks that are over 10s old
		FastList<String> markForDelete = new FastList<String>();
		for(Map.Entry<String, Long> lock : this.locks.entrySet()) {
			if (timeNow - lock.getValue() > 10000) {
				markForDelete.add(lock.getKey());
			}
		}
		for(Integer count = 0; count < markForDelete.size(); count++) {
			this.locks.remove(markForDelete.get(count));
		}

		if (timeNow - this.timeCheck > 1001) {
			this.timeCheck =  new Date().getTime();
		}
	}

	/**
	 * Removes a lock
	 * 
	 * @param clickId 
	 */
	public void removeLock(String clickId) {
		this.locks.remove(clickId);
	}
}