precision mediump float;

varying vec3 vColor;
varying float vOrientation;

void main(){
    bool isBoundaryHorizontal = vOrientation > 0.5;
    float opacity = isBoundaryHorizontal ? 1.0 : 0.8;
    gl_FragColor = vec4(vColor, opacity);
}
