#import "PermissionsManager.h"
#import <React/RCTLog.h>
#import <AVFoundation/AVFoundation.h>
#import <Photos/Photos.h>

@implementation PermissionsManager

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(requestPermissions:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self requestCameraPermission:resolve rejecter:reject];
    [self requestMicrophonePermission:resolve rejecter:reject];
    [self requestPhotoLibraryPermission:resolve rejecter:reject];
  });
}

- (void)requestCameraPermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted) {
    if (granted) {
      resolve(@{@"camera": @YES});
    } else {
      resolve(@{@"camera": @NO});
    }
  }];
}

- (void)requestMicrophonePermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeAudio completionHandler:^(BOOL granted) {
    if (granted) {
      resolve(@{@"microphone": @YES});
    } else {
      resolve(@{@"microphone": @NO});
    }
  }];
}

- (void)requestPhotoLibraryPermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
  [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
    if (status == PHAuthorizationStatusAuthorized) {
      resolve(@{@"photoLibrary": @YES});
    } else {
      resolve(@{@"photoLibrary": @NO});
    }
  }];
}

@end