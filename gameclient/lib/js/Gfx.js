// The following line is for JSHint
/*global gfx: true, pools: true, msg: true, oauth: true, dom: true, THREE: true, Stats: true, utils: true, requestAnimationFrame: true */

function _Gfx() {
	var self = this;
	
	// The WebGL renderer.
	this.renderer = null;

	// Camera and scene.
	this.camera = null;
	this.scene = null;
	
	// Used for detecting collisions.	
	this.rayLand = null;
	this.projector = null;

	// How wide and long is the land plane.
	this.landSize = 8000;
	
	// Starting position.
	// [x, y]
	this.position = null;
	
	// Active user objects pool.
	this.users = [];
	
	// Active beam objects pool.
	this.beams = [];
	
	// Flag that indicates if animation has started.
	this.started = false;
	
	// Flag that indicates if user clicked the start button.
	this.startClicked = false;

	// Mouse handling variables.
	this.mouse = {x: 0, y: 0};
	this.mouseDown = false;
	
	// The clicked player id.
	this.clickId = null;
	
	// Frames per second related.
	this.fps = null;

	/**
	 * Toggles camera freeze.
	 */
	this.toggleActiveCamera = function() {
		if (self.startClicked) {
			if (self.camera.movementSpeed === 0) {
				self.camera.lookSpeed = 3 / 30;
				self.camera.movementSpeed = 200;
			} else {
				self.camera.lookSpeed = 3 / 3000;
				self.camera.movementSpeed = 0;
			}
		}
	};
	
	/*
	 * Assigns methods to the mouse events for the container element.
	 */
	this.initDomHandlers = function() {
		document.getElementById('overlay').onmousemove = function(e) {
			e.preventDefault();

			self.mouse.x = (e.clientX / dom.width) * 2 - 1;
			self.mouse.y = - (e.clientY / dom.height) * 2 + 1;
		};
		document.getElementById('overlay').onmousedown = function(e) {
			e.preventDefault();
			e.stopPropagation();

			self.mouseDown = !self.mouseDown;
		};
		document.getElementById('overlay').onmouseup = function(e) {
			e.preventDefault();
			e.stopPropagation();

			self.mouseDown = !self.mouseDown;
		};
	};
	
	this.damageEffect = function() {
		$('#overlay').css('background', '#880000');
		$('#overlay').animate({
			opacity: 0.1
		}, 650, function() {
			$('#overlay').css('background', 'transparent');
			$('#overlay').css('opacity', 1);
		});
	};
	
	this.deadEffect = function() {
		$('#overlay').css('background', '#880000');
		$('#overlay').css('opacity', 0.7);
		self.toggleActiveCamera();
	};
	
	/**
	 * Initializes new player objects.
	 */
	this.insertPlayers = function() {
		for (var id in pools.defs.players) {
			if (!self.users[id] && id != pools.player.id) {
				var data = pools.defs.players[id];

				var playerType = data.type;
				var ballColor = null;
				if (playerType == 'foe') {
					ballColor = 0x660000;
				} else if (playerType == 'ally') {
					ballColor = 0x000066;
				} else if (playerType == 'weak') {
					ballColor = 0x000000;
				}

				self.users[id] = [];

				// Create the user ball.
				self.users[id].ball = 
					new THREE.Mesh(
						new THREE.SphereGeometry(5, 8, 8),
						new THREE.MeshBasicMaterial({color: ballColor}));

				self.users[id].ball.position.x = 0;
				self.users[id].ball.position.y = 0;
				self.users[id].ball.position.z = 0;

				// User specifics.
				self.users[id].ball.user = {
					type: playerType,
					id: id
				};

				// Set collidesion detection for users.
				var sc = new THREE.SphereCollider(self.users[id].ball.position, 5);
				sc.mesh = self.users[id].ball;
				THREE.Collisions.colliders.push(sc);

				dom.log('New user connected');

				// Create the user id text.
				self.users[id].userIdText = 
					self.getUserIdText(data.name);

				// Create the user pic.
				self.users[id].userPic = 
					self.getUserPic(data.picture);

				// Add ball and user id text to scene.
				self.users[id].ball.addChild(self.users[id].userIdText);
				self.users[id].ball.addChild(self.users[id].userPic);
				self.scene.addChild(self.users[id].ball);
			}
		}
	};
	
	this.deletePlayers = function() {
		for (var id in self.users) {
			if (!pools.defs.players[id]) {
				dom.log('User disconnected');

				self.scene.removeChildRecurse(self.users[id].ball);
				delete self.users[id];

				$('#map-' + id).remove();
			}
		}
	};
	
	this.updatePlayers = function() {
		for (var pid in pools.players) {
			if (self.users[pid]) {
				var data = pools.players[pid];

				self.users[pid].ball.position.x = data.position.x;
				self.users[pid].ball.position.y = data.position.y;
				self.users[pid].ball.position.z = data.position.z;

				self.users[pid].userIdText.rotation.y = (-1 * data.rotation.theta) + 1.57;

				self.users[pid].userPic.position.x = 
					(5.1 * Math.sin(data.rotation.phi) * Math.cos(data.rotation.theta));
				self.users[pid].userPic.position.z = 
					(5.1 * Math.sin(data.rotation.phi) * Math.sin(data.rotation.theta));
				self.users[pid].userPic.position.y = 
					(5.1 * Math.cos(data.rotation.phi));
				self.users[pid].userPic.rotation.y = 
					(-1 * data.rotation.theta) + 1.57;
				
				if (data.health === 0) {
					self.users[pid].ball.user.type = 'dead';
				} else {
					self.users[pid].ball.user.type = 
						pools.defs.players[pid].type;
				}
			}
		}
	};
	
	/**
	 * Keeps beams in sync
	 */
	this.updateBeams = function() {
		// First remove in-active beams.
		for (var bid in self.beams) {
			if (!pools.beams[bid]) {
				self.scene.removeChild(self.beams[bid]);
				delete self.beams[bid];
			}
		}
		
		// Then insert any new.
		// Already added beams are automatically managed since their geometry -
		//	is a reference to the ball objects.
		for (var ppid in pools.beams) {
			if (!self.beams[ppid] && ppid != pools.player.id && pools.beams[ppid] != pools.player.id) {
				try {
					var beamMaterial = new THREE.LineBasicMaterial({color: 0xFF0000});
					var beamGeometry = new THREE.Geometry();
					beamGeometry.vertices.push(new THREE.Vertex(self.users[ppid].ball.position));
					beamGeometry.vertices.push(new THREE.Vertex(self.users[pools.beams[ppid]].ball.position));

					var beam = new THREE.Line(beamGeometry, beamMaterial);

					self.beams[ppid] = beam;

					self.scene.addChild(beam);
				} catch (e) {
					
				}
			} else if (self.beams[ppid]) {	
				self.beams[ppid].geometry.__dirtyVertices = true;
			}
		}
	};

	/**
	 * Updates world.
	 */
	this.updateWorld = function() {
		self.deletePlayers();
		self.insertPlayers();
		self.updatePlayers();
		self.updateBeams();
	};

	/**
	 * Generates and returns the user id text object.
	 */
	this.getUserIdText = function(userName) {
		var userIdTextGeometry = 
			new THREE.TextGeometry(userName, {
				size: 0.8, height: 0.1, bezelEnabled: false
			});
		var userIdTextMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
		var userIdTextMesh = new THREE.Mesh(userIdTextGeometry, userIdTextMaterial);

		userIdTextMesh.position.y = 7;

		return userIdTextMesh;
	};

	/**
	 * Generates and returns the user picture object.
	 */
	this.getUserPic = function(userPic) {
		var userIdTextGeometry = 
			new THREE.PlaneGeometry(6.5, 6.5, 154, 128);
		var userIdTextMaterial = new THREE.MeshBasicMaterial({
			map: THREE.ImageUtils.loadTexture(userPic)});
		var userIdTextMesh = new THREE.Mesh(userIdTextGeometry, userIdTextMaterial);
		userIdTextMesh.doubleSided = false;

		return userIdTextMesh;
	};

	/**
	 * Initializes THREE renderer and starts the rendering process.
	 */
	this.init = function(position) {
		try {
			dom.log('Initializing 3D environment...');

			self.renderer = new THREE.WebGLRenderer();
		} catch (e) {
			dom.log('Failed to initialize 3D environment!');

			return 0;
		}
		
		// Set starting position.
		self.position = position;

		// Set canvas size.
		self.renderer.setSize(dom.width, dom.height);

		// Ray used for land collision detection.
		self.rayLand = new THREE.Ray();
		self.rayLand.origin.y = 10000;
		self.rayLand.direction = new THREE.Vector3(0, -1, 0);

		// Variables used for user collision detection.
		self.projector = new THREE.Projector();
		
		// Load camera, scene, and static objects.
		var loadScene = self.initScene();

		// Assign generated objects to class properties.
		self.scene = loadScene.scene;
		self.camera = loadScene.camera;

		// Initialize mouse handlers.
		self.initDomHandlers();

		document.getElementById('container').appendChild(self.renderer.domElement);

		$('#start').show();

		msg.canNotify = true;

		dom.log('Initialized 3D environment');
		
		// Frames per second stats.
		self.fps = new Stats();
		self.fps.domElement.id = 'fps-stats';
		self.fps.domElement.style.position = 'absolute';
		self.fps.domElement.style.top = '247px';
		self.fps.domElement.style.left = '221px';
		self.fps.domElement.style.zIndex = 100;
		document.getElementById('container').appendChild(self.fps.domElement);

		self.animate();
		
		self.started = true;
	};

	/**
	 * Instantiates initial scene, camera and objects.
	 */
	this.initScene = function() {
		// Daylight modifier.
		var d = new Date();
		var hour = d.getHours();
		if (hour <= 12) hour = 13 - hour; else hour = hour - 11;hour /= 2;

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
		result.camera.position.y = self.position.x;
		result.camera.position.x = self.position.y;
		result.camera.position.z = 0;

		// Point light instantiation.
		var sunPointLight = new THREE.PointLight(0x222222, 12 * 1.5 / hour);
		sunPointLight.position.y = 2200;
		result.scene.addChild(sunPointLight);

		// Sun object instantiation.
		var sunMaterial = new THREE.MeshBasicMaterial({color: 0xFFD700});
		var sun = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 32), sunMaterial);
		sun.position.y = 2200;
		result.scene.addChild(sun);

		// Sky object instantiation.
		var skyGeometry = new THREE.SphereGeometry(16000, 32, 32);
		var skyMaterial = new THREE.MeshBasicMaterial({color: 0x0099BB / hour});
		var sky = new THREE.Mesh(skyGeometry, skyMaterial);
		sky.flipSided = true;	
		sky.rotation.x = Math.PI / 2;
		sky.position.y = 2500;
		result.scene.addChild(sky);

		// Land geometry.
		var data = utils.generateHeight(32, 32);
		var landGeometry = new THREE.PlaneGeometry(self.landSize, self.landSize, 31, 31);
		for (var i = 0; i < landGeometry.vertices.length; i++) {
			landGeometry.vertices[i].position.z = data[i] * 20;
		}
		// Land material.
		var landMaterial = new THREE.MeshPhongMaterial({ambient: 0x009900, color: 0xff0000, shininess: 30, shading: THREE.FlatShading});
		// Land object instantiation.
		var land = new THREE.Mesh(landGeometry, landMaterial);
		land.rotation.x = - Math.PI / 2;
		result.scene.addChild(land);

		// Creates a ball grid on the land object.
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

		THREE.Collisions.colliders.push(THREE.CollisionUtils.MeshColliderWBox(land));

		return result;
	};

	/**
	 * Animation method.
	 * 
	 * Currently puts camera above the land object at all times.
	 */
	this.animate = function() {
		// When self frame is rendered call method animate again.
		requestAnimationFrame(self.animate);
        
		self.rayLand.origin.x = self.camera.position.x;
		self.rayLand.origin.z = self.camera.position.z;

		var lastPos = self.camera.position.clone();

		// Get the camera position above the land object.
		var c = THREE.Collisions.rayCastNearest(self.rayLand);
		if (c) {
			lastPos = self.rayLand.origin.clone().subSelf(new THREE.Vector3(0, c.distance - 5, 0));
		}

		// Reset other users' color.
		for (var k in self.users) {
			if (self.users[k] === undefined) continue;
			
			if (self.users[k].ball.user.type == 'foe') {
				self.users[k].ball.materials[0].color.setHex(0x660000);
			} else if (self.users[k].ball.user.type == 'ally') {
				self.users[k].ball.materials[0].color.setHex(0x000066);
			} else if (self.users[k].ball.user.type == 'dead') {
				self.users[k].ball.materials[0].color.setHex(0xFFFFFF);
			}
		}
		
		self.clickId = null;
		var vector = new THREE.Vector3(self.mouse.x, self.mouse.y, 0.5);
		self.projector.unprojectVector(vector, self.camera);
		var rayMouse = new THREE.Ray(self.camera.position, vector.subSelf(self.camera.position).normalize());
		var c1 = THREE.Collisions.rayCastAll(rayMouse);
		if (c1.length >=1 && c1.length <=2) {
			for (var x in c1) {
				if (c1[x].mesh.user !== undefined && c1[x].mesh.user.type !== undefined) {
					if (c1[x].mesh.user.type == 'foe') {
						// Set highlight color.
						c1[x].mesh.materials[0].color.setHex(0xFF0000);
						self.clickId = null;
						if (self.mouseDown) {
							// Set click color.
							c1[x].mesh.materials[0].color.setHex(0x00BB00);
							self.clickId = c1[x].mesh.user.id;
						}
					} else if (c1[x].mesh.user.type == 'ally') {
						c1[x].mesh.materials[0].color.setHex(0x0000FF);
					}
				}
			}
		}
		
		self.camera.position = lastPos.clone();

		// Cannot notify if an other notification is in progress.
		if (msg.canNotify) {
			msg.canNotify = false;

			//setTimeout(msg.updatePlayer(), 1000 / msg.interval);
			msg.updatePlayer();
		}

		// Renders our scene.
		self.render();
		
		// Update fps stats
		self.fps.update();
	};

	/**
	 * Render method.
	 * 
	 * Calls the THREE render method and notifies server of the -
	 * camera position.
	 */
	this.render = function() {
		self.renderer.render(self.scene, self.camera);
	};
}
