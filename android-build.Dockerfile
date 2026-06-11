# Headless Android build environment for CI / hardware-free APK builds.
# Build the image once, then run the app's gradle build against a MOUNTED repo
# (so node_modules + android/ are used live and .dockerignore doesn't strip them):
#
#   docker build -f android-build.Dockerfile -t rc-car-android .
#   docker run --rm -v "$PWD":/app -w /app/android rc-car-android ./gradlew assembleDebug --no-daemon
#
# Base has Node (for the React Native gradle codegen/bundling) + JDK 17.
FROM node:22-bookworm

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jdk-headless unzip wget git && rm -rf /var/lib/apt/lists/*

ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH=${PATH}:/opt/android-sdk/cmdline-tools/latest/bin:/opt/android-sdk/platform-tools

# Android command-line tools.
RUN mkdir -p ${ANDROID_HOME}/cmdline-tools && cd ${ANDROID_HOME}/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdtools.zip && \
    unzip -q cmdtools.zip && mv cmdline-tools latest && rm cmdtools.zip

# SDK packages matching the RN 0.86 scaffold (compileSdk 36, NDK 27, cmake).
RUN yes | sdkmanager --licenses >/dev/null && \
    sdkmanager --install \
      "platform-tools" \
      "platforms;android-36" \
      "build-tools;36.0.0" \
      "ndk;27.1.12297006" \
      "cmake;3.22.1" >/dev/null

WORKDIR /app
