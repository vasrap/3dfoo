package net.scaraveos._3dfoo.server.gamelogic;

import java.util.Date;
import org.apache.log4j.Logger;
import org.jwebsocket.logging.Logging;
import org.jwebsocket.plugins.streaming.TokenStream;
import org.jwebsocket.server.TokenServer;

public class BcastStream extends TokenStream {

	private static Logger log = Logging.getLogger(BcastStream.class);
	private Boolean isRunning = false;
	private GameProcess gameProcess = null;
	private Thread gameThread = null;

	public BcastStream(String streamID, TokenServer server) {
		super(streamID, server);
		this.startStream(-1);
	}

	@Override
	public void startStream(long timeout) {
		if (this.log.isDebugEnabled()) {
			this.log.debug("Starting game logic bcast stream...");
		}
		super.startStream(timeout);

		this.gameProcess = new GameProcess();
		this.gameThread = new Thread(this.gameProcess);
		this.gameThread.start();
	}

	@Override
	public void stopStream(long timeout) {
		if (this.log.isDebugEnabled()) {
			this.log.debug("Stopping game logic bcast stream...");
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
				this.log.warn("Game logic bcast stream did not stop after " + duration + "ms.");
			} else {
				this.log.debug("Game logic bcast stream stopped after " + duration + "ms.");
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
					getServer().broadcastToken(PlugIn.gameEngine.getBcastToken());
					Thread.sleep(1000 / 35);
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