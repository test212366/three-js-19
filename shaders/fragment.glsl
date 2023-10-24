uniform float time;
uniform float progress;
uniform sampler2D uTexture;
uniform vec4 resolution;
uniform vec3 uColor;

varying vec2 vUv;
varying vec3 vPosition;
varying vec2 vReference;

float PI = 3.1415926;
 
void main() {
 
	vec2 ref = vReference;

	vec4 ttt = texture2D(uTexture, gl_PointCoord );
 

	gl_FragColor = vec4(uColor, ttt.r);
}