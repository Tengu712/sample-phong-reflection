# Phong Reflection Model Simulator

A sample program simulating the Phong reflection model.
The graphics API used is WebGL2.
The 3D model is in JSON format and embedded in an HTML file as JavaScript.

You can run this program from [here](https://Tengu712.github.io/Sample-Phong-Reflection).

The Phong reflection model is a common shading technique.
The color on a surface of a polygon $I_p$ is determined by the following formula:

$$ I_p = k_ai_a + k_d (L \cdot N) i_d + k_s (R \cdot V)^\alpha i_s $$

- $k_a$: the ambient reflection constant
- $k_d$: the diffuse reflection constant
- $k_s$: the specular reflection constant
- $i_a$: the intensities of the ambient components of the light
- $i_d$: the intensities of the diffuse components of the light
- $i_s$: the intensities of the specular components of the light
- $\alpha$: the shininess constant for this material
- $L$: the direction vector from the surface towards the light
- $N$: the normal at the surface
- $R$: the direction vector of the reflected light.
- $V$: the direction vector from the surface towards the camera
