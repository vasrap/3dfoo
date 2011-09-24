// The following lines are for JSHint
/* $, chat, dom, gfx, map, msg, oauth, pools, utils : true */
/*global $, chat, dom, map, msg, oauth, pools, utils, Stats, THREE, requestAnimationFrame : true */

/**
 * The 3D class responsible for initializing the 3D environment and -
 * instantiating and keeping all 3D objects up to date.
 *
 * @author: Vasilis Raptakis (@scaraveos)
 */
var gfx = {
	// The WebGL renderer.
	renderer : null,

	// Helper renderer.
	helperCntr : null,
	helperRndr : null,

	// Camera and scene.
	camera : null,
	scene : null,

	// Used for detecting collisions.	
	rayLand : null,
	projector : null,

	// How wide and long is the land plane.
	landSize : 8000,
	
	// Starting position.
	position : [0, 0],
	
	// Active player 3D objects.
	players : {},
	
	// Active beam 3D objects.
	beams : {},
	
	// Flag indicating if animation has started.
	engineStarted : false,
	
	// Flag indicating if player clicked the start button.
	startClicked : false,

	// Mouse handling variables.
	mouse : {x: 0, y: 0, xx: 0, yy: 0},
	mouseDown : false,
	
	// The clicked player id.
	clickId : null,
	
	// Frames per second.
	fps : null,

	/**
	 * Activates camera.
	 */
	cameraActive : function () {
		if (gfx.startClicked) {
			gfx.camera.lookSpeed = 3 / 30;
			gfx.camera.movementSpeed = 200;
		}
	},
	
	/**
	 * Deactivates camera.
	 */
	cameraInactive : function () {
		if (gfx.startClicked) {
			gfx.camera.lookSpeed = 3 / 3000;
			gfx.camera.movementSpeed = 0;
		}
	},
	/*
	 * Assigns methods to the mouse events for the overlay element.
	 * Mostly used for mouse collision detection with other players -
	 * and managing shooting.
	 */
	initDomHandlers : function () {
		var overlayEl = document.getElementById('overlay');

		overlayEl.onmousemove = function (e) {
			e.preventDefault();

			gfx.mouse.x = (e.clientX / dom.width) * 2 - 1;
			gfx.mouse.y = - (e.clientY / dom.height) * 2 + 1;

			gfx.mouse.xx = e.clientX;
			gfx.mouse.yy = e.clientY;
		};
		overlayEl.onmousedown = function (e) {
			e.preventDefault();
			e.stopPropagation();

			gfx.mouseDown = !gfx.mouseDown;
		};
		overlayEl.onmouseup = function (e) {
			e.preventDefault();
			e.stopPropagation();

			gfx.mouseDown = !gfx.mouseDown;
		};
	},
	
	// What to do when health is changing.
	// TODO: create CSS classes to manage the effect.
	damageEffect : function () {
		var overlayEl = $('#overlay');

		overlayEl.css({'background': '#880000'});
		overlayEl.animate({opacity: 0.1}, 650, function () {
			overlayEl.css({'background': 'transparent'});
			overlayEl.css({'opacity': 1});
		});
	},
	
	// What to do when health is 0.
	// TODO: create CSS classes to manage the effect.
	deadEffect : function () {
		var overlayEl = $('#overlay');

		overlayEl.css({'background': '#880000'});
		overlayEl.css({'opacity': 0.8});
		gfx.cameraInactive();
	},
	
	/**
	 * Updates 3D objects.
	 */
	updateWorld : function () {
		gfx.deletePlayers();
		gfx.insertPlayers();
		gfx.updatePlayers();
		gfx.updateBeams();
	},

	/**
	 * Initializes new player objects.
	 */
	insertPlayers : function () {
		for (var id in pools.defs.players) {
			if (pools.defs.players.hasOwnProperty(id)) {
				if (!gfx.players[id] && id !== pools.player.id) {
					var playerDef = pools.defs.players[id];
		
					// Figure out how to color players.
					var playerType = playerDef.type;
					var ballColor = null;
					if (playerType === 'foe') {
						ballColor = 0x660000;
					} else if (playerType === 'ally') {
						ballColor = 0x000066;
					} else if (playerType === 'weak') {
						ballColor = 0xFFA500;
					} else if (playerType === 'ghost') {
						ballColor = 0xFFFFFF;
					}

					// Create the player ball 3D object.
					var ball = 
						new THREE.Mesh(
							new THREE.SphereGeometry(5, 8, 8),
							new THREE.MeshBasicMaterial({color: ballColor}));
					ball.position.x = 0;
					ball.position.y = 0;
					ball.position.z = 0;

					// Add player type and id properties for future reference.
					ball.player = {
						type: playerType,
						id: id
					};

					// Set collidesion detection for players.
					var sc = new THREE.SphereCollider(ball.position, 5);
					sc.mesh = ball;
					THREE.Collisions.colliders.push(sc);

					dom.log('New player connected.');

					// Create the player id text.
					var playerIdText = gfx.getPlayerIdText(playerDef.name);

					// Create the player pic.
					var playerPic = gfx.getPlayerPic(playerDef.picture);

					// Assign text and picture as child 3D objects.
					ball.addChild(playerIdText);
					ball.addChild(playerPic);

					// Initialize player.
					var newPlayerEnt = {};

					// Add player object references to the new player.
					newPlayerEnt.ball = ball;
					newPlayerEnt.playerIdText = playerIdText;
					newPlayerEnt.playerPic = playerPic;
					
					// Add player 3D object to the scene.
					gfx.scene.addChild(ball);
					
					// Add new player to the players pool.
					gfx.players[id.toString()] = newPlayerEnt;
				}
			}
		}
	},
	
	/**
	 * Removes obsolete player 3D objects.
	 */
	deletePlayers : function () {
		for (var id in gfx.players) {
			if (gfx.players.hasOwnProperty(id)) {
				if (!pools.defs.players[id]) {
					dom.log('User disconnected.');

					// Remove 3D object from the scene.
					gfx.scene.removeChildRecurse(gfx.players[id].ball);
					delete gfx.players[id];

					// Remove player from the map.
					map.remove(id);
				}
			}
		}
	},
	
	/**
	 * Update active player information.
	 */
	updatePlayers : function () {
		for (var id in pools.players) {
			if (pools.players.hasOwnProperty(id)) {
				var playerEnt = gfx.players[id];

				if (playerEnt) {
					var playerUpd = pools.players[id];

					// Update position.
					playerEnt.ball.position.x = playerUpd.position.x;
					playerEnt.ball.position.y = playerUpd.position.y;
					playerEnt.ball.position.z = playerUpd.position.z;

					// Update rotation.
					playerEnt.playerIdText.rotation.y = (-1 * playerUpd.rotation.theta) + 1.57;

					playerEnt.playerPic.position.x = 
						(5.1 * Math.sin(playerUpd.rotation.phi) * Math.cos(playerUpd.rotation.theta));
					playerEnt.playerPic.position.z = 
						(5.1 * Math.sin(playerUpd.rotation.phi) * Math.sin(playerUpd.rotation.theta));
					playerEnt.playerPic.rotation.y = 
						(-1 * playerUpd.rotation.theta) + 1.57;
					
					// Update player type (ie. weak, ghost, etc).
					playerEnt.ball.player.type = pools.defs.players[id].type;
				}
			}
		}
	},
	
	/**
	 * Update the beam 3D objects.
	 */
	updateBeams : function () {
		var selfPlayerId = pools.player.id;

		// Removes in-active beams.
		for (var id in gfx.beams) {
			if (gfx.beams.hasOwnProperty(id)) {
				if (!pools.beams[id]) {
					gfx.scene.removeChild(gfx.beams[id]);
					delete gfx.beams[id];
				}
			}
		}
		
		// Inserts new beams.
		// Already added beams are automatically managed since their geometry -
		// is a reference to the player 3D objects.
		for (id in pools.beams) {
			if (pools.beams.hasOwnProperty(id)) {
				var beamEnt = gfx.beams[id];
				var playerEnt = gfx.players[id];

				// If this is a new 3D beam object
				if (!beamEnt && id !== selfPlayerId && beamEnt !== selfPlayerId) {
					var beamMaterial = new THREE.LineBasicMaterial({color: 0xFF0000});
					var beamGeometry = new THREE.Geometry();
					beamGeometry.vertices.push(new THREE.Vertex(gfx.players[id].ball.position));
					beamGeometry.vertices.push(new THREE.Vertex(gfx.players[pools.beams[id]].ball.position));

					var beam = new THREE.Line(beamGeometry, beamMaterial);

					gfx.beams[id.toString()] = beam;

					gfx.scene.addChild(beam);

				// If the 3D beam object already exists.
				} else if (beamEnt) {
					// Update vertices on render.	
					beamEnt.geometry.__dirtyVertices = true;
				}
			}
		}
	},

	/**
	 * Generates and returns the player id text object.
	 */
	getPlayerIdText : function (playerName) {
		var geometry = 
			new THREE.TextGeometry(playerName, {
				size: 0.8, height: 0.1, bezelEnabled: false
			});
		var material = new THREE.MeshBasicMaterial({color: 0xffffff});
		var ent = new THREE.Mesh(geometry, material);

		ent.position.y = 7;

		return ent;
	},

	/**
	 * Generates and returns the player picture object.
	 */
	getPlayerPic : function (playerPic) {
		var geometry = 
			new THREE.PlaneGeometry(6.5, 6.5, 154, 128);

		// Get image from local proxy to avoid cross origin requests.
		var playerPicUrl = '/rest/service.py/pic-proxy/' + encodeURI(playerPic);

		var texture = THREE.ImageUtils.loadTexture(playerPicUrl);
		var material = new THREE.MeshBasicMaterial({map: texture});
		var ent = new THREE.Mesh(geometry, material);
		ent.doubleSided = false;

		return ent;
	},

	/**
	 * Initializes THREE renderer and starts the rendering process.
	 */
	init : function (position) {
		// Initialize helper renderer.
		gfx.helperCntr = document.getElementById('helperCntr');
		gfx.helperRndr = helperCntr.getContext('2d');
		gfx.helperRndr.canvas.width = dom.width;
		gfx.helperRndr.canvas.height = dom.height;

		var containerEl = document.getElementById('container');

		// Try to initialize 3D the renderer.
		try {
			dom.log('Initializing 3D environment...');

			gfx.renderer = new THREE.WebGLRenderer();
		} catch (e) {
			dom.log('Failed to initialize 3D environment!');

			return 0;
		}
		
		// Set starting position.
		gfx.position = position;

		// Set canvas size.
		gfx.renderer.setSize(dom.width, dom.height);

		// Ray used for land collision detection.
		gfx.rayLand = new THREE.Ray();
		gfx.rayLand.origin.y = 10000;
		gfx.rayLand.direction = new THREE.Vector3(0, -1, 0);

		// Variables used for player collision detection.
		gfx.projector = new THREE.Projector();
		
		// Load camera, scene, and static objects.
		var loadScene = gfx.initScene();

		// Assign generated 3D objects to class properties.
		gfx.scene = loadScene.scene;
		gfx.camera = loadScene.camera;

		// Initialize mouse handlers.
		gfx.initDomHandlers();

		// Attach the 3D rendered to the DOM element.
		containerEl.appendChild(gfx.renderer.domElement);

		dom.log('Initialized 3D environment');
		
		// Frames per second stats.
		gfx.fps = new Stats();
		gfx.fps.domElement.id = 'fps-stats';
		gfx.fps.domElement.style.position = 'absolute';
		gfx.fps.domElement.style.zIndex = 100;
		containerEl.appendChild(gfx.fps.domElement);

		// Trigger the rendering process.
		gfx.animate();

		// Activate camera.
		gfx.cameraActive();
	},

	/**
	 * Instantiates initial scene, camera and 3D objects.
	 */
	initScene : function () {
		// Scene and camera instantiation.
		var result = {
			"scene": new THREE.Scene(),
			"camera": new THREE.FirstPersonCamera({
				"fov"   : 45.000000,
				"aspect": dom.width / dom.height,
				"near"  : 0.01,
				"far"   : 1000000.00,				
				"movementSpeed": 0,
				"lookVertical": false,
				"lookSpeed": 3 / 3000
			})
		};
		result.camera.position.y = gfx.position.x;
		result.camera.position.x = gfx.position.y;
		result.camera.position.z = 0;

		// Point light instantiation.
		var sunPointLight = new THREE.PointLight(0x222222, 6);
		sunPointLight.position.y = 2200;
		result.scene.addChild(sunPointLight);

		// Sun 3D object instantiation.
		var sunMaterial = new THREE.MeshBasicMaterial({color: 0xFFD700});
		var sun = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 32), sunMaterial);
		sun.position.y = 2200;
		result.scene.addChild(sun);

		// Sky 3D object instantiation.
		var skyGeometry = new THREE.SphereGeometry(16000, 32, 32);
		var skyMaterial = new THREE.MeshBasicMaterial({color: 0x0099BB});
		var sky = new THREE.Mesh(skyGeometry, skyMaterial);
		sky.flipSided = true;	
		sky.rotation.x = Math.PI / 2;
		sky.position.y = 2500;
		result.scene.addChild(sky);

		// Land geometry.
		var data = utils.generateHeight(32, 32);
		var landGeometry = new THREE.PlaneGeometry(gfx.landSize, gfx.landSize, 31, 31);
		for (var i = 0; i < landGeometry.vertices.length; i++) {
			landGeometry.vertices[i].position.z = data[i] * 20;
		}
		// Land material.
		var landMaterial = new THREE.MeshPhongMaterial({ambient: 0x009900, color: 0xff0000, shininess: 30, shading: THREE.FlatShading});
		// Land 3D object instantiation.
		var land = new THREE.Mesh(landGeometry, landMaterial);
		land.rotation.x = - Math.PI / 2;
		result.scene.addChild(land);

		// Creates a grid out of 3D spheres on top of the land object.
		for (var k = 0; k < land.geometry.vertices.length; k = k + 10) {
			var ball = new THREE.Mesh(
				new THREE.SphereGeometry(15, 8, 8),
				new THREE.MeshBasicMaterial({color: 0xFF6600}));
			ball.position = land.geometry.vertices[k].position.clone();
			var tmpZ = ball.position.z;
			ball.position.z =  - ball.position.y;
			ball.position.y = tmpZ + 15;

			result.scene.addObject(ball);
		}	

		// Add land for collision detection.
		THREE.Collisions.colliders.push(THREE.CollisionUtils.MeshColliderWBox(land));

		return result;
	},

	/**
	 * Animation.
	 */
	animate : function () {
		var camera = gfx.camera;

		// When this frame is done rendering call animate again.
		requestAnimationFrame(gfx.animate);
        
		gfx.rayLand.origin.x = camera.position.x;
		gfx.rayLand.origin.z = camera.position.z;

		// Get the camera above the land object at all times.
		var c = THREE.Collisions.rayCastNearest(gfx.rayLand);
		if (c) {
			camera.position = gfx.rayLand.origin.clone().subSelf(new THREE.Vector3(0, c.distance - 5, 0));
		}

		// Reset other players' color.
		for (var id in gfx.players) {
			if (gfx.players.hasOwnProperty(id)) {
				var playerEnt = gfx.players[id];

				if (playerEnt === undefined) {
					continue;
				}
				
				// Create references for use inside the local scope (faster look-up).
				var ballUserType = playerEnt.ball.player.type;
				var ballMaterialColor = playerEnt.ball.materials[0].color;

				if (ballUserType === 'foe') {
					ballMaterialColor.setHex(0x660000);
				} else if (ballUserType === 'ally') {
					ballMaterialColor.setHex(0x000066);
				} else if (ballUserType === 'weak') {
					ballMaterialColor.setHex(0x000000);
				} else if (ballUserType === 'ghost') {
					ballMaterialColor.setHex(0xFFFFFF);
				}
			}
		}
		
		// Figures out mouse - player collisions and shooting.
		gfx.clickId = null;
		var vector = new THREE.Vector3(gfx.mouse.x, gfx.mouse.y, 0.5);
		gfx.projector.unprojectVector(vector, camera);
		var rayMouse = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize());
		var c1 = THREE.Collisions.rayCastAll(rayMouse);
		if (c1.length === 2) {
			for (var x = 0; x < c1.length; x++) {
				// Create references for use inside the local scope (faster look-up).
				var playerInfo = c1[x].mesh.player;
				var materialColor = c1[x].mesh.materials[0].color;

				if (playerInfo !== undefined && playerInfo.type !== undefined) {
					if (playerInfo.type === 'foe') {
						// Set highlight color.
						materialColor.setHex(0xFF0000);
						gfx.clickId = null;
						if (gfx.mouseDown) {
							// Set click color.
							materialColor.setHex(0x00BB00);
							gfx.clickId = playerInfo.id;
						}
					} else if (playerInfo.type === 'ally') {
						materialColor.setHex(0x0000FF);
					}
				}
			}
		}

		// Cannot notify if an other notification is in progress or -
		// if player hasn't clicked start yet.
		if (msg.canNotify) {
			msg.canNotify = false;
			
			msg.updatePlayer();
		}

		// Renders the scene.
		gfx.render();
		
		// Updates fps stats.
		gfx.fps.update();
	},

	/**
	 * Helper renderer.
	 *
	 * Currently used for simulating player beam gun.
	 */
	helperRenderer : function() {
		// Reset helper canvas.
		gfx.helperRndr.canvas.width = dom.width;

		if (gfx.mouseDown) {
			gfx.helperRndr.strokeStyle = '#f00';
		} else {
			gfx.helperRndr.strokeStyle = '#500';
		}

		gfx.helperRndr.moveTo(gfx.mouse.xx, gfx.mouse.yy);
		gfx.helperRndr.lineTo(dom.width * 0.5, dom.height - 50);

		gfx.helperRndr.stroke();
	},

	/**
	 * Rendering.
	 */
	render : function () {
		gfx.renderer.render(gfx.scene, gfx.camera);
		gfx.helperRenderer();
	}
};
