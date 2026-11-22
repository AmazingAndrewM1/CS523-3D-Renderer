precision mediump float;

varying vec3 vColor;
varying float vOrientation;
varying vec2 fTextureCoordinates;

uniform sampler2D uTexture;

void main(){
    gl_FragColor = texture2D(uTexture, fTextureCoordinates);
}
