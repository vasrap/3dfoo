package net.scaraveos._3dfoo.server.models;

import javolution.util.FastMap;

/**
 * Player add-on definition class
 * 
 * @author scaraveos
 */
public class Addon {
	private String id = null;
	private String name = null;
	private String picture = null;
	private FastMap attributes = null;

	public FastMap getAttributes() {
		return attributes;
	}

	public void setAttributes(FastMap attributes) {
		this.attributes = attributes;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
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

	public Addon(String id, String name, String picture, FastMap attributes) {
		this.id = id;
		this.name = name;
		this.picture = picture;
		this.attributes = attributes;
	}

	// TODO: implement
	public static FastMap<String, FastMap<String, Object>> buildDefMapFromXml(String configFile) {
		return new FastMap<String, FastMap<String, Object>>();
	}
}