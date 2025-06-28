# Liquid Glass Effect with React Native Skia

An interactive, draggable liquid glass and magnifying lens effect built with React Native, Skia, Gesture Handler, and Reanimated.

This project demonstrates how to combine the power of Skia shaders with high-performance gesture handling in React Native to create beautiful, interactive visual effects that run at a smooth 60 FPS.



https://github.com/user-attachments/assets/098696ef-c41b-44f7-af5e-ae5ac900c3db



## 💡 Original Shader

The SkSL shader used in this project is a direct translation and adaptation of the beautiful "Liquid Glass" GLSL shader by **Dominaants**.

- **Original Source:** [**shadertoy.com/view/3cdXDX**](https://www.shadertoy.com/view/3cdXDX)

Big thanks to the original creator for the inspiration and foundational code.

---

## ✨ Features

- **Interactive & Draggable:** Grab the lens and move it around with your finger.
- **GPU-Powered:** The entire effect is a single SkSL (Skia Shading Language) fragment shader running on the GPU.
- **Dynamic Effects:** Creates a real-time blur, distortion, and lighting effect on any content underneath it.
- **Performant:** Uses `react-native-reanimated` and `useDerivedValue` to send gesture data directly to the UI thread, bypassing the React Native bridge for lag-free updates.
- **Customizable:** Easily change the lens dimensions, shape, and other properties by modifying the shader uniforms.

## 💻 Tech Stack

- [React Native](https://reactnative.dev/)
- [React Native Skia](https://shopify.github.io/react-native-skia/) for 2D graphics rendering.
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) for smooth gesture interactions.
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) for performant state management and animations on the UI thread.
- [Skia Shading Language (SkSL)](https://skia.org/docs/user/sksl/) for the custom visual effect.

## 🚀 Getting Started

To run this project locally:

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/your-username/liquid-glass-rn-skia.git](https://github.com/your-username/liquid-glass-rn-skia.git)
    cd liquid-glass-rn-skia
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the app**
    ```bash
    npx expo start
    ```

## 🧠 How It Works

The magic of this project lies in efficiently connecting gesture input to a shader uniform.

1.  A **SkSL shader** is written as a string and compiled at runtime using `Skia.RuntimeEffect.Make()`. This shader is responsible for rendering everything based on input "uniforms" like resolution, mouse position, and dimensions.

2.  **`react-native-gesture-handler`** captures pan gestures on the `<Canvas />` component.

3.  The gesture's coordinates are stored in **Reanimated Shared Values** (`useSharedValue`).

4.  A **`useDerivedValue`** hook listens for changes in the shared values and creates a `vec2` (vector) object.

5.  This derived value is passed directly into the `<Shader />` component's `uniforms` prop. Because Reanimated and Skia are natively integrated, this update happens entirely on the UI thread, resulting in a highly performant and responsive animation.

Here is the core connection in the component:

```jsx
// App.js

// 1. Store gesture position in shared values
const x = useSharedValue(width / 2);
const y = useSharedValue(height / 2);

// 2. Create the gesture handler
const gesture = Gesture.Pan().onUpdate((e) => {
  x.value = e.x;
  y.value = e.y;
});

// 3. Create a derived value that the shader can read
const mouse = useDerivedValue(() => {
  return vec(x.value, y.value);
}, [x, y]);

// 4. Pass the derived value directly to the shader's uniforms
const uniforms = useDerivedValue(() => ({
    // ... other uniforms
    iMouse: mouse.value,
}), [mouse]);

// ... render the GestureDetector and Canvas
<Shader source={source} uniforms={uniforms} />
