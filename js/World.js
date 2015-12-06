"use strict";
class World {
  constructor(domElement){
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1 , 10000);
      this.camera.position.z = 1000;
      let gemometry = new THREE.BoxGeometry( 200, 200, 200);
      let material = new THREE.MeshBasicMaterial( { color:0xffff00, wireframe: true});
      let mesh = new THREE.Mesh(gemometry, material);
      mesh.rotation.z = 1;
      mesh.rotation.y = 1;
      this.scene.add(mesh);
      this.renderer = new THREE.WebGLRenderer({antialias : true});
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.objects = [];
      this.newObjects = [];
      document.body.appendChild(this.renderer.domElement);
  }

  render (){
    this.renderer.render(this.scene, this.camera);
  }

  update (){
    for(let object of this.newObjects){
      this.scene.add(object.getMesh());
      this.objects.push(object);
    }
    this.newObjects = [];
    for(let object of this.objects){
      object.update();
    }
    this.camera.position.z -= 1;
  }

  addObject (object){
    this.newObjects.push(object);
  }
};

class PhysicsObject {
  constructor(posX, posY, posZ, mass){
    this.x = posX;
    this.y = posY;
    this.z = posZ;
    this.mass = mass;
  }

  getMesh (){
    let gemometry = new THREE.SphereGeometry( this.mass, 32, 32 );
    let material = new THREE.MeshBasicMaterial( { color:0xaaaaaa, wireframe: false});
    let mesh = new THREE.Mesh(gemometry, material);
    mesh.x = this.posX;
    mesh.y = this.posY;
    mesh.z = this.posY;
    this.mesh = mesh;
    return mesh;
  }
}

class Bob extends PhysicsObject{
  constructor(posX, posY, posZ, mass){
    super(posX, posY, posZ, mass);
  }
}

class Pendulum extends PhysicsObject{
  constructor(length, x, y, z, bob){
    super(x,y,z);
    this.length = length;
    this.bob = bob;
  }

  update (){

  }

  getMesh (){
    let gemometry = new THREE.CylinderGeometry( 0.02*this.length, 0.02*this.length, this.length/2, 4 );
    let material = new THREE.MeshBasicMaterial( { color:0xaaaaff, wireframe: false});
    let mesh = new THREE.Mesh(gemometry, material);
    let group = new THREE.Group();
    group.children.push(mesh);
    group.children.push(this.bob.getMesh());
    this.mesh = group;
    return group;
  }
}

class SimplePendulum extends Pendulum{
    constructor(length, x, y, z, bob){
      super(length, x, y, z, bob);
    }
}

var world = new World();
var bob = new Bob(0,-350,0, 50);
var pendulum = new SimplePendulum(350, 0, 0, 0, bob);
world.addObject(pendulum);
var step = function(){
  requestAnimationFrame(step);
  world.update();
  world.render();
}
step();
