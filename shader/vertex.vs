precision mediump float;
attribute vec2 aPosition;
attribute vec3 aColor;

uniform int uMapLength;

varying vec3 vColor;

void main(){
    vec2 screenPosition = aPosition * 2.0 / float(uMapLength) - 1.0;
    gl_Position = vec4(screenPosition, 0.0, 1.0);
    gl_PointSize = 5.0;
    vColor = aColor;
}
