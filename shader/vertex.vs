precision mediump float;
attribute vec2 aPosition;
attribute float aOrientation;
attribute vec3 aColor;

uniform int uWindowHeight;

varying vec3 vColor;
varying float vOrientation;

void main(){
    vec2 normalizedPosition = 2.0 * aPosition / float(uWindowHeight) - 1.0;
    gl_Position = vec4(normalizedPosition, 0.0, 1.0);
    gl_PointSize = 5.0;
    
    vColor = aColor;
    vOrientation = aOrientation;
}
