import { StyleSheet, useWindowDimensions } from "react-native";
import {
  Canvas,
  ImageShader,
  Skia,
  Fill,
  Shader,
  vec,
  useImage,
} from "@shopify/react-native-skia";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useDerivedValue,
} from "react-native-reanimated";

const source = Skia.RuntimeEffect.Make(`
// Uniforms provided by the Skia environment
uniform float2 iResolution;
uniform float2 iMouse;
uniform shader iChannel0;

uniform float2 glassDimensions; // e.g., float2(300.0, 250.0)

half4 main(float2 fragCoord) {
    float2 uv = fragCoord / iResolution.xy;

    float2 mouse = iMouse.xy;
    float2 pixel_dist = fragCoord - mouse;
    float2 norm_dist = pixel_dist / (glassDimensions / 2.0);
    float roundedBox = pow(abs(norm_dist.x), 8.0) + pow(abs(norm_dist.y), 8.0);
    float rb1 = clamp((1.0 - roundedBox) * 8.0, 0.0, 1.0); // Inner, filled area
    float rb2 = clamp((0.95 - roundedBox * 0.95) * 16.0, 0.0, 1.0) - clamp(pow(0.9 - roundedBox * 0.95, 1.0) * 16.0, 0.0, 1.0); // The border
    float rb3 = (clamp((1.5 - roundedBox * 1.1) * 2.0, 0.0, 1.0) - clamp(pow(1.0 - roundedBox * 1.1, 1.0) * 2.0, 0.0, 1.0)); // The outer shadow/glow

    half4 fragColor;
    float transition = smoothstep(0.0, 1.0, rb1 + rb2);

    if (transition > 0.0) {
        float2 lens;
        float zoom = max(0.0, 1.0 - roundedBox * 0.5); // Ensure zoom doesn't go negative
        lens = ((uv - 0.5) * zoom + 0.5);

        half4 blurredColor = half4(0.0);
        float total = 0.0;
        for (float x = -4.0; x <= 4.0; x++) {
            for (float y = -4.0; y <= 4.0; y++) {
                float2 offset = float2(x, y) * 0.5 / iResolution.xy;
                blurredColor += iChannel0.eval((offset + lens) * iResolution.xy);
                total += 1.0;
            }
        }
        blurredColor /= total;
        float2 m2 = (uv - mouse / iResolution.xy); // Keep original m2 for gradient calculation
        float gradient = clamp((clamp(m2.y, 0.0, 0.2) + 0.1) / 2.0, 0.0, 1.0) + clamp((clamp(-m2.y, -1000.0, 0.2) * rb3 + 0.1) / 2.0, 0.0, 1.0);
        half4 lighting = clamp(blurredColor + half4(rb1) * gradient + half4(rb2) * 0.3, 0.0, 1.0);
        half4 originalColor = iChannel0.eval(uv * iResolution.xy);
        fragColor = mix(originalColor, lighting, transition);

    } else {
        fragColor = iChannel0.eval(uv * iResolution.xy);
    }

    return fragColor;
}`);

export default function App() {
  const image = useImage(require("./assets/insta.png"));
  const { width, height } = useWindowDimensions();
  const x = useSharedValue(width / 2);
  const y = useSharedValue(height / 2);
  const gesture = Gesture.Pan().onUpdate((e) => {
    x.value = e.x;
    y.value = e.y;
  });

  const mouse = useDerivedValue(() => {
    return vec(x.value, y.value);
  }, [x, y]);

  const uniforms = useDerivedValue(() => {
    return {
      iResolution: vec(width, height),
      iMouse: mouse.value,
      glassDimensions: vec(200, 200),
    };
  }, [mouse]);

  if (!image) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={gesture}>
        <Canvas style={styles.container}>
          <Fill>
            <Shader source={source} uniforms={uniforms}>
              <ImageShader
                image={image}
                fit="fitWidth"
                rect={{ x: 0, y: 0, width, height }}
              />
            </Shader>
          </Fill>
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
