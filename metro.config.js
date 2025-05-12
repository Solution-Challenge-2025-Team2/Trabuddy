const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.assetExts.push('cjs');
defaultConfig.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json');

// 메모리 사용량 최적화
defaultConfig.maxWorkers = 2;
defaultConfig.transformer.minifierConfig = {
    compress: {
        reduce_funcs: false,
        keep_infinity: true,
        drop_console: false
    }
};

module.exports = defaultConfig; 