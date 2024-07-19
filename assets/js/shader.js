export const shaderData = {
  vertexShader: `varying vec2 vUv;
        void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 0.5 );
    }`,
  rainbow: {
    fragementShader: `uniform vec2 iResolution;
uniform float iTime;

#define EPS vec2(1e-4, 0.0)

float time;

vec3 rotateX(float a, vec3 v)
{
    return vec3(v.x, cos(a) * v.y + sin(a) * v.z, cos(a) * v.z - sin(a) * v.y);
}

vec3 rotateY(float a, vec3 v)
{
    return vec3(cos(a) * v.x + sin(a) * v.z, v.y, cos(a) * v.z - sin(a) * v.x);
}

float sphere(vec3 p, float r)
{
    return length(p) - r;
}

float plane(vec3 p, vec4 n)
{
    return dot(p, n.xyz) - n.w;
}

float sceneDist(vec3 p)
{
    const int num_spheres = 32;

    float sd = 1e3;


    for(int i = 0; i < num_spheres; ++i)
    {
        float r = 0.22 * sqrt(float(i));
        vec3 p2 = rotateX(cos(time + float(i) * 0.2) * 0.15, p);
        float cd = -sphere(p2 + vec3(0.0, -0.9, 0.0), 1.3);
        sd = min(sd, max(abs(sphere(p2, r)), cd) - 1e-3);
    }

    return sd;
}

vec3 sceneNorm(vec3 p)
{
    float d = sceneDist(p);
    return normalize(vec3(sceneDist(p + EPS.xyy) - d, sceneDist(p + EPS.yxy) - d, sceneDist(p + EPS.yyx) - d));
}

vec3 col(vec3 p)
{
    float a = length(p) * 20.0;
    return vec3(0.5) + 0.5 * cos(vec3(a, a * 1.1, a * 1.2));
}

// ambient occlusion approximation (thanks to simesgreen)
float ambientOcclusion(vec3 p, vec3 n)
{
    const int steps = 4;
    const float delta = 0.5;

    float a = 0.0;
    float weight = 3.0;
    for(int i=1; i<=steps; i++) {
        float d = (float(i) / float(steps)) * delta; 
        a += weight*(d - sceneDist(p + n*d));
        weight *= 0.5;
    }
    return clamp(1.0 - a, 0.0, 1.0);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec2 t = uv * 2.0 - vec2(1.0);
    t.x *= iResolution.x / iResolution.y;

    time = iTime;

    vec3 ro = vec3(-0.4, sin(time * 2.0) * 0.05, 0.7), rd = rotateX(1.1, rotateY(0.5, normalize(vec3(t.xy, -0.8))));
    float f = 0.0;
    vec3 rp, n;

    for(int i = 0; i < 100; ++i)
    {
        rp = ro + rd * f;
        float d = sceneDist(rp);
        
        if(abs(d) < 1e-4)
            break;
        
        f += d;
    }

    n = sceneNorm(rp);

    vec3 l = normalize(vec3(1.0, 1.0, -1.0));

    float ao = ambientOcclusion(rp, n);

    fragColor.rgb = vec3(0.5 + 0.5 * clamp(dot(n, l), 0.0, 1.0)) * col(rp) * mix(0.1, 1.0, ao) * 1.6;
    fragColor.a = 1.0;
}

varying vec2 vUv;
void main() {
  mainImage(gl_FragColor, vUv * iResolution.xy);
}`,
  },
  colorRing: {
    fragementShader: `uniform vec2 iResolution;
uniform float iTime;

#define TAU 6.2831852
#define MOD3 vec3(.1031,.11369,.13787)
#define BLACK_COL vec3(16,21,25)/255.

vec3 hash33(vec3 p3)
{
    p3 = fract(p3 * MOD3);
    p3 += dot(p3, p3.yxz+19.19);
    return -1.0 + 2.0 * fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
}

float simplex_noise(vec3 p)
{
    const float K1 = 0.333333333;
    const float K2 = 0.166666667;

    vec3 i = floor(p + (p.x + p.y + p.z) * K1);
    vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
        
    vec3 e = step(vec3(0.0), d0 - d0.yzx);
    vec3 i1 = e * (1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy * (1.0 - e);

    vec3 d1 = d0 - (i1 - 1.0 * K2);
    vec3 d2 = d0 - (i2 - 2.0 * K2);
    vec3 d3 = d0 - (1.0 - 3.0 * K2);

    vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
    vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));

    return dot(vec4(31.316), n);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord.xy-iResolution.xy*0.5)/iResolution.y;
        
    float a = sin(atan(uv.y, uv.x));
    float am = abs(a-.5)/4.;
    float l = length(uv);                         

    float m1 = clamp(.1/smoothstep(.0, 1.75, l), 0., 1.);
    float m2 = clamp(.1/smoothstep(.42, 0., l), 0., 1.);
    float s1 = (simplex_noise(vec3(uv*2., 1. + iTime*.525))*(max(1.0 - l*1.75, 0.)) + .9);
    float s2 = (simplex_noise(vec3(uv*1., 15. + iTime*.525))*(max(.0 + l*1., .025)) + 1.25);
    float s3 = (simplex_noise(vec3(vec2(am, am*100. + iTime*3.)*.15, 30. + iTime*.525))*(max(.0 + l*1., .25)) + 1.5);
    s3 *= smoothstep(0.0, .3345, l);    

    float sh = smoothstep(0.15, .35, l);


    float m = m1*m1*m2 * ((s1*s2*s3) * (1.-l)) * sh;
    //m = clamp(m, 0., 1.);

    vec3 col = mix(BLACK_COL, (0.5 + 0.5*cos(iTime+uv.xyx*3.+vec3(0,2,4))), m);
            
    fragColor = vec4(col, 1.);
}

varying vec2 vUv;
void main() {
  mainImage(gl_FragColor, vUv * iResolution.xy);
}`,
  },
  fire: {
    fragementShader: `uniform float iTime;
uniform float fogDensity;
uniform vec3 fogColor;
uniform vec2 iResolution;
uniform vec2 iMouse;

const vec3 c = vec3(1, 0, -1);
const mat2 m = .4 * mat2(4, 3, -3, 4);

// Created by David Hoskins and licensed under MIT.
// See https://www.shadertoy.com/view/4djSRW.
float hash12(vec2 p)
{
	vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract(dot(p3.xy, p3.zz));
}

float lfnoise(vec2 t)
{
    vec2 i = floor(t);
    t = c.xx * smoothstep(0., 1., fract(t));
    vec2 v1 = 2. * mix(vec2(hash12(i), hash12(i + c.xy)), vec2(hash12(i + c.yx), hash12(i + c.xx)), t.y) - 1.;
    return mix(v1.x, v1.y, t.x);
}

float fbm(vec2 uv)
{
    vec2 uv0 = uv;
    uv = uv * vec2(5., 2.) - vec2(-2., -.25) - 3.1 * iTime * c.yx;
	float f = 1.,
        a = .5,
        c = 2.5;

    for(int i = 0; i < 5; ++i) {
        uv.x -= .15 * clamp(1. - pow(uv0.y, 4.), 0., 1.) * lfnoise(c * (uv + float(i) * .612 + iTime));
        c *= 2.;
        f += a * lfnoise(uv + float(i) * .415);
        a /= 2.;
        uv *= m;
    }
    return f / 2.;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    fragColor = vec4(clamp(1.5 * pow(clamp(pow(fbm(uv), 1. + 4. * clamp(uv.y * uv.y, 0., 1.)) * 1.5, 0., 1.) * c.xxx, vec3(1, 3, 6)), 0., 1.), 1.);
}


varying vec2 vUv;
void main() {
  mainImage(gl_FragColor, vUv * iResolution.xy);
}`,
  },
  pinkVoid: {
    fragementShader: `uniform float iTime;
uniform vec2 iResolution;

#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define HALF_PI 1.57079632679


// FBM implementation from
// https://github.com/MaxBittker/glsl-fractal-brownian-noise

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
  {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
  }



float fbm3d(vec3 x, const in int it) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100);

    
    for (int i = 0; i < 32; ++i) {
        if(i<it) {
            v += a * snoise(x);
            x = x * 2.0 + shift;
            a *= 0.5;
        }
    }
    return v;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float t = iTime * .2;
    
    vec2 uv = ( fragCoord -.5 * iResolution.xy ) / iResolution.y;
    vec2 st = vec2(
        length( uv ) * 1.5,
        atan( uv.y, uv.x )
    );
    
    st.y += st.x * 1.1;
        
    float x = fbm3d(
        vec3(
            sin( st.y ),
            cos( st.y ),
            pow( st.x, .3 ) + t * .1
        ),
        3
    );
	float y = fbm3d(
        vec3(
            cos( 1. - st.y ),
            sin( 1. - st.y ),
            pow( st.x, .5 ) + t * .1
        ),
        4
    );
    
    float r = fbm3d(
        vec3(
            x,
            y,
            st.x + t * .3
        ),
        5
    );
    r = fbm3d(
        vec3(
            r - x,
            r - y,
            r + t * .3
        ),
        6
    );
    
    float c = ( r + st.x * 5. ) / 6.;
    
    fragColor = vec4(
        smoothstep( .3, .4, c ),
        smoothstep( .4, .55, c ),
        smoothstep( .2, .55, c ),
        1.0
    );
}

varying vec2 vUv;
void main() {
  mainImage(gl_FragColor, vUv * iResolution.xy);
}`,
  },
};
