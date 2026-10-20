import * as THREE from 'three';

// Real spheres and physical clearcoat. Pigment follows object-space coordinates,
// so its curved ribbon rolls with the marble while studio reflections stay lit.
export function createMarbles(renderer,count,radius=7.4){
  // Three large light cards create clean curved reflections, without the busy
  // window pattern of a room HDRI at the small size used by the game.
  const studio=new THREE.Scene(),pmrem=new THREE.PMREMGenerator(renderer);
  studio.background=new THREE.Color().setRGB(.035,.025,.055);
  const cards=[];
  for(const [w,h,x,y,z,power]of[[5,6,-4,6,7,3.2],[2,4,6,-1,5,1.1]]){
    const card=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color().setRGB(power,power,power*1.04),side:THREE.DoubleSide}));
    card.position.set(x,y,z);card.lookAt(0,0,0);studio.add(card);cards.push(card);
  }
  const studioTarget=pmrem.fromScene(studio,.025);for(const c of cards){c.geometry.dispose();c.material.dispose();}pmrem.dispose();
  renderer.transmissionResolutionScale=.5;
  function material(color=0xffffff){
    const m=new THREE.MeshPhysicalMaterial({color,metalness:0,roughness:.23,
      clearcoat:.8,clearcoatRoughness:.12,ior:1.52,specularIntensity:.7,
      transmission:0,thickness:radius*1.5,attenuationDistance:radius*6,
      envMap:studioTarget.texture,envMapIntensity:.7});
    m.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
        varying vec3 vMarblePosition;
        varying float vMarbleSeed;
        #ifdef USE_INSTANCING
          attribute float marbleSeed;
        #endif`);
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        vMarblePosition=position/${radius.toFixed(2)};
        vMarbleSeed=0.37;
        #ifdef USE_INSTANCING
          vMarbleSeed=marbleSeed;
        #endif`);
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
        varying vec3 vMarblePosition;
        varying float vMarbleSeed;`);
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        vec3 marblePoint=normalize(vMarblePosition);
        float curl=marblePoint.y+0.34*sin(marblePoint.x*3.5+marblePoint.z*2.2+vMarbleSeed*6.283);
        float ribbon=1.0-smoothstep(0.06,0.32,abs(curl));
        float pigment=0.78+0.22*sin(marblePoint.z*3.0+marblePoint.x*2.0+vMarbleSeed*4.0);
        vec3 marbleBody=diffuseColor.rgb*pigment;
        vec3 marbleRibbon=mix(diffuseColor.rgb,vec3(0.96,0.98,1.0),0.12);
        diffuseColor.rgb=mix(marbleBody,marbleRibbon,ribbon*0.72);`);
    };
    m.customProgramCacheKey=()=>`king-rico-marbles-${radius}`;
    return m;
  }
  const geometry=new THREE.SphereGeometry(radius,24,16);
  geometry.setAttribute('marbleSeed',new THREE.InstancedBufferAttribute(Float32Array.from({length:count},(_,i)=>((i*0.61803398875)%1)),1));
  const mesh=new THREE.InstancedMesh(geometry,material(),count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;
  const shadowMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying vec2 vUv;void main(){float r=length((vUv-.5)*2.0);float a=(1.0-smoothstep(.05,1.0,r))*.34;gl_FragColor=vec4(.025,.005,.04,a);}`});
  const shadows=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),shadowMaterial,count);
  shadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);shadows.frustumCulled=false;
  const transform=new THREE.Object3D();
  function set(id,x,y,z,scale,angle=0){
    transform.position.set(x,y,z);
    transform.rotation.set(id*.73+angle*.47,id*.39+angle*.63,angle);
    transform.scale.setScalar(scale);transform.updateMatrix();mesh.setMatrixAt(id,transform.matrix);
    transform.position.set(x+2.3,y-3.5,10);transform.rotation.set(0,0,0);
    transform.scale.set(radius*2.8*scale,radius*2.4*scale,1);transform.updateMatrix();shadows.setMatrixAt(id,transform.matrix);
  }
  return {mesh,shadows,material,set,flush(){mesh.instanceMatrix.needsUpdate=true;shadows.instanceMatrix.needsUpdate=true;}};
}
