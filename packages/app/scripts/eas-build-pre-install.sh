#!/usr/bin/env bash
# EAS Environment Secrets
# Run Path: packages/app

# 设置 JAVA_HOME 指向特定的 JDK 8 版本
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk1.8.0_351.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH

# 添加 cmake 3.18.1 到 PATH
export PATH=/Users/fan/Library/Android/sdk/cmake/3.18.1/bin:$PATH

# 设置 NODE_ENV 环境变量
export NODE_ENV=production

# 检查 Java 版本
echo "Checking Java version..."
java -version

echo "@onekeyhq:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" > ~/.npmrc

# 输出环境变量
echo "NPM_TOKEN: ${NPM_TOKEN}"
echo "IOS_SECRET: ${IOS_SECRET}"
echo "ANDROID_SECRET: ${ANDROID_SECRET}"

# Install Secret Keys
echo "Decoding and installing iOS secret..."
echo $IOS_SECRET | base64 -d > .env
echo "Decoding and installing Android secret..."
echo $ANDROID_SECRET | base64 -d > android/keys.secret

# 检查 cmake 版本
echo "Checking cmake version..."
cmake --version
