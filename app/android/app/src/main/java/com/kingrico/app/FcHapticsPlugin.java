package com.kingrico.app;

import android.content.Context;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Vibração do jogo com força controlada.
 * O navigator.vibrate do WebView só controla a duração e usa a força padrão do aparelho, que em muitos
 * celulares é fraca. Aqui a força vai até o máximo do motor (amplitude 255).
 * JS: Capacitor.nativePromise('FcHaptics', 'vibrate', { pattern: [on, off, on, ...] ms, strength: 0..1 })
 */
@CapacitorPlugin(name = "FcHaptics")
public class FcHapticsPlugin extends Plugin {

    private Vibrator vibrator() {
        Context ctx = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            VibratorManager vm = (VibratorManager) ctx.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            return vm != null ? vm.getDefaultVibrator() : null;
        }
        return (Vibrator) ctx.getSystemService(Context.VIBRATOR_SERVICE);
    }

    @PluginMethod
    public void vibrate(PluginCall call) {
        Vibrator v = vibrator();
        if (v == null || !v.hasVibrator()) {
            call.resolve();
            return;
        }
        long[] pattern;
        try {
            JSArray arr = call.getArray("pattern", new JSArray());
            pattern = new long[arr.length()];
            for (int i = 0; i < arr.length(); i++) pattern[i] = Math.max(0, Math.min(2000, arr.getLong(i)));
        } catch (Exception e) {
            call.reject("pattern inválido");
            return;
        }
        if (pattern.length == 0) {
            call.resolve();
            return;
        }
        double strength = Math.max(0, Math.min(1, call.getDouble("strength", 1.0)));
        int amp = Math.max(1, (int) Math.round(255 * strength));

        // Formato do navigator.vibrate: [ligado, desligado, ligado, ...]. O Android começa por um trecho
        // desligado, então entra um 0 na frente.
        long[] timings = new long[pattern.length + 1];
        int[] amps = new int[pattern.length + 1];
        for (int i = 0; i < pattern.length; i++) {
            timings[i + 1] = pattern[i];
            amps[i + 1] = i % 2 == 0 ? amp : 0;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            v.cancel();
            if (v.hasAmplitudeControl()) v.vibrate(VibrationEffect.createWaveform(timings, amps, -1));
            else v.vibrate(VibrationEffect.createWaveform(timings, -1));
        } else {
            v.vibrate(timings, -1);
        }
        call.resolve();
    }
}
