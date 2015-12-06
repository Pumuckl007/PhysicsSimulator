"use strict";
class World {
  constructor(domElement){
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1 , 10000);
      this.camera.position.z = 4;
      this.renderer = new THREE.WebGLRenderer({antialias : true});
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.objects = [];
      this.newObjects = [];
      this.time = 0;
      let dirLight = new THREE.DirectionalLight(0xFFFFFF, 1);
      dirLight.position.set(100,100,50);
      this.scene.add(dirLight);
      let ambLight = new THREE.AmbientLight(0x404040);
      this.scene.add(ambLight);
      document.body.appendChild(this.renderer.domElement);
      this.renderer.setClearColor( 0xffffff );
  }

  addGrid(){
    let size = 40, step = 1;

    let geometry = new THREE.Geometry();
    let material = new THREE.LineBasicMaterial( { color: 0xcccccc, opacity: 0.2 } );

    for ( let i = - size; i <= size; i += step ) {

        geometry.vertices.push( new THREE.Vector3( - size, 0, i ) );
        geometry.vertices.push( new THREE.Vector3(   size, 0, i ) );

        geometry.vertices.push( new THREE.Vector3( i, 0, - size ) );
        geometry.vertices.push( new THREE.Vector3( i, 0,   size ) );

    }

    let line = new THREE.Line( geometry, material, THREE.LineSegments );
    this.scene.add( line );
  }

  static G (){
    return 9.81;
  }

  render (){
    this.renderer.render(this.scene, this.camera);
  }

  update (){
    this.time += 1/60;
    for(let object of this.newObjects){
      this.scene.add(object.getMesh());
      this.objects.push(object);
    }
    this.newObjects = [];
    for(let object of this.objects){
      object.update();
    }
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
    let gemometry = new THREE.SphereGeometry( this.mass/5, 32, 32 );
    let material = new THREE.MeshPhongMaterial( { color:0xaaaaaa, specular: 0x555555, shininess: 30});
    let mesh = new THREE.Mesh(gemometry, material);
    mesh.position.x = this.x;
    mesh.position.y = this.y;
    mesh.position.z = this.z;
    this.mesh = mesh;
    return mesh;
  }
}

class Bob extends PhysicsObject{
  constructor(mass){
    super(0, 0, 0, mass);
  }
}

class Pendulum extends PhysicsObject{
  constructor(length, x, y, z, bob){
    super(x,y,z);
    this.length = length;
    this.bob = bob;
    this.forceRenderer = new ForceRenderer([]);
  }

  update (){

  }

  getMesh (){
    let gemometry = new THREE.CylinderGeometry( 0.03, 0.03, this.length, 4 );
    gemometry.translate(0, -this.length/2, 0);
    let material = new THREE.MeshPhongMaterial( { color:0xcf9458, specular: 0x555555, shininess: 30});
    let mesh = new THREE.Mesh(gemometry, material);
    this.stringMesh = mesh;
    let obj = new THREE.Object3D();
    let bob = this.bob.getMesh();
    this.bobMesh = bob;
    obj.children.push(mesh);
    obj.children.push(bob);
    obj.children.push(this.forceRenderer.getMesh());
    obj.position.set(this.x, this.y, this.z);
    this.mesh = obj;
    return obj;
  }
}

class SimplePendulum extends Pendulum{
    constructor(length, x, y, z, bob, initialTheta){
      super(length, x, y, z, bob);
      this.initialTheta = initialTheta;
    }

    update(){
      this.mesh.rotation.z = this.angle();
      this.stringMesh.rotation.z = this.mesh.rotation.z;
      this.stringMesh.position.set(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z);
      this.bobMesh.position.set(this.posX(), this.posY() , this.posZ());
      super.update();
    }

    angle(){
      return this.initialTheta*Math.cos( 2 * Math.PI / this.periodTime() * world.time);
    }

    periodTime(){
      return 2*Math.PI*Math.sqrt(this.length / World.G());
    }

    xVel(){
      let inside = 2*Math.PI/this.periodTime() * world.time;
      let first = this.length * Math.cos(this.initialTheta * Math.cos(inside));
      let second = -this.initialTheta*Math.sin(inside);
      let thired = 2*Math.PI/this.periodTime();
      return first * second * thired;
    }

    yVel(){
      let inside = 2*Math.PI/this.periodTime() * world.time;
      let first = this.length * Math.cos(this.initialTheta * Math.cos(inside));
      let second = -this.initialTheta*Math.sin(inside);
      let thired = 2*Math.PI/this.periodTime();
      return first * second * thired;
    }

    posX(){
      return this.length * Math.sin(this.initialTheta * Math.cos(2*Math.PI/this.periodTime() * world.time)) + this.x;
    }

    posY(){
      return -this.length * Math.cos(this.initialTheta * Math.cos(2*Math.PI/this.periodTime() * world.time)) + this.y;
    }

    posZ(){
      return this.z;
    }
}

class ForceRenderer{
  constructor(forces, scale, width){
    this.forces = forces;
    this.mesh = new THREE.Object3D();
    this.foward = new Three.Vector3(0,1,0);
    this.scale = scale;
    this.width = width;
  }

  updateForce(name, vector){
    this.forces[name] = vector;
  }

  setRotation(x, y, z){
    this.mesh.rotation.set(x,y,z);
    for(let mesh of this.mesh.children){
      mesh.rotation.set(x,y,z);
    }
  }

  buildMesh(){
    this.mesh.children = [];
    for(let force of this.forces){
        let geomBody = new THREE.CylinderGeometry(this.width, this.width, force.length()*this.scale, 6, 1, true);
        geomBody.translate(0, force.length/2*this.scale, 0);
        let geomHead = new THREE.CylinderGeometry(this.width*2, 0, force.length/6*this.scale, 6);
        geomHead.translate(0, 11*force.length/12*this.scale, 0);
        let geom = GeometryUtils.merge(geomBody, geomHead);
        let norm = force.clone.normalize();
        let mat = new THREE.MeshBasicMaterial(Math.floor(0xFF*(norm.x+1)/2)*0x10000 + Math.floor(0xFF*(norm.y+1)/2)*0x100 + Math.floor(0xFF*(norm.x+1)/2));
        this.mesh.children.push(new THREE.Mesh(geom, mat));
    }
  }

  // makePerpAndPerralel(axis){
  //   this.foward = axis.clone().normalize();
  //   let forces = [];
  //   let aligment = new THREE.Vector3(0,1,0);
  //   let quaternion = new THREE.Quaternion();
  //   quaternion.setFromUnitVectors(this.foward, aligment);
  //   let fw = 0, bk = 0; lf = 0; rg = 0; up = 0; dw = 0;
  //   for(force of this.forces){
  //     let f = force.clone();
  //     f.applyQuaternion(quaternion);
  //     if(f.x < 0){
  //
  //     }
  //   }

  // }

  getMesh(){
    return this.mesh;
  }
}

var world = new World();
world.addGrid();
var bob = new Bob(1);
var pendulum = new SimplePendulum(1, 0, 1, 0, bob, 1);
world.addObject(pendulum);
var step = function(){
  requestAnimationFrame(step);
  world.update();
  world.render();
}
step();
