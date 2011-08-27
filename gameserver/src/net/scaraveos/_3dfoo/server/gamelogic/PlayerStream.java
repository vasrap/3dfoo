package net.scaraveos._3dfoo.server.gamelogic;

import java.util.Date;
import java.util.Map;
import javolution.util.FastMap;
import org.apache.log4j.Logger;
import org.jwebsocket.logging.Logging;
import org.jwebsocket.plugins.streaming.TokenStream;
import org.jwebsocket.server.TokenServer;
import org.jwebsocket.token.Token;

public class PlayerStream extends TokenStream {

	private static Logger log = Logging.getLogger(PlayerStream.class);
	private Boolean isRunning = false;
	private GameProcess gameProcess = null;
	private Thread gameThread = null;
	private Engine gameEngine = null;

	public PlayerStream(String streamID, TokenServer server) {
		super(streamID, server);
		this.startStream(-1);
	}
	
	public void setGameEngine(Engine gameEngine) {
		this.gameEngine = gameEngine;
	}

	@Override
	public void startStream(long timeout) {
		if (this.log.isDebugEnabled()) {
			this.log.debug("Starting game logic player stream...");
		}
		super.startStream(timeout);

		this.gameProcess = new GameProcess();
		this.gameThread = new Thread(this.gameProcess);
		this.gameThread.start();
	}

	@Override
	public void stopStream(long timeout) {
		if (this.log.isDebugEnabled()) {
			this.log.debug("Stopping game logic player stream...");
		}
		
		long started = new Date().getTime();
		
		this.isRunning = false;
		
		try {
			this.gameThread.join(timeout);
		} catch (Exception e) {
			this.log.error(e.getClass().getSimpleName() + ": " + e.getMessage());
		}
		
		if (this.log.isDebugEnabled()) {
			long duration = new Date().getTime() - started;
			if (this.gameThread.isAlive()) {
				this.log.warn("Game logic player stream did not stop after " + duration + "ms.");
			} else {
				this.log.debug("Game logic player stream stopped after " + duration + "ms.");
			}
		}

		super.stopStream(timeout);
	}

	private class GameProcess implements Runnable {
		@Override
		public void run() {
			if (log.isDebugEnabled()) {
				log.debug("Running game logic bcast stream...");
			}
			
			isRunning = true;
			
			while (isRunning) {
				try {
					Thread.sleep(750);

					FastMap<String, Token> playerTokens = gameEngine.getPlayerTokens();
					
					for (Map.Entry<String, Token> playerToken : playerTokens.entrySet()) {
						try {
							getServer().sendToken(
								getServer().getConnector(playerToken.getKey()), 
								playerToken.getValue());
						} catch (Exception e) {
							// TODO: player is probably disconnected, remove -
							//	them from the engine players pool
						}
					}
				} catch (InterruptedException e) {
					log.error("(run) " + e.getClass().getSimpleName() + ": " + e.getMessage());
				}
			}
			if (log.isDebugEnabled()) {
				log.debug("Game logic bcast stream stopped.");
			}
		}
	}
}