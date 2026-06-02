import React from 'react';
import { View, Text } from 'react-native';

// Stub for react-native-google-mobile-ads on web.
// Ads are native-only and cannot render in the web preview.

export const BannerAdSize = {
  BANNER: 'BANNER',
  FULL_BANNER: 'FULL_BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  LEADERBOARD: 'LEADERBOARD',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  ADAPTIVE_BANNER: 'ADAPTIVE_BANNER',
  ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
  INLINE_ADAPTIVE_BANNER: 'INLINE_ADAPTIVE_BANNER',
  WIDE_SKYSCRAPER: 'WIDE_SKYSCRAPER',
};

export const AdEventType = {
  LOADED: 'loaded',
  ERROR: 'error',
  OPENED: 'opened',
  CLICKED: 'clicked',
  CLOSED: 'closed',
};

export const RewardedAdEventType = {
  LOADED: 'loaded',
  EARNED_REWARD: 'earned_reward',
};

export const TestIds = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
};

export const BannerAd = ({ size }: { size?: string; unitId?: string; onAdFailedToLoad?: (error: unknown) => void }) => (
  <View style={{ width: '100%', height: 50, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
    <Text style={{ color: '#999', fontSize: 12 }}>Ad (native only)</Text>
  </View>
);

const createAdStub = () => ({
  load: () => {},
  show: () => {},
  addAdEventListener: () => () => {},
  removeAllListeners: () => {},
});

export const InterstitialAd = {
  createForAdRequest: () => createAdStub(),
};

export const RewardedAd = {
  createForAdRequest: () => createAdStub(),
};

export const AppOpenAd = {
  createForAdRequest: () => createAdStub(),
};

export const useInterstitialAd = () => ({
  isLoaded: false,
  isClosed: false,
  load: () => {},
  show: () => {},
  error: null,
});

export const useRewardedAd = () => ({
  isLoaded: false,
  isClosed: false,
  isEarnedReward: false,
  load: () => {},
  show: () => {},
  reward: null,
  error: null,
});

export const useAppOpenAd = () => ({
  isLoaded: false,
  isClosed: false,
  load: () => {},
  show: () => {},
  error: null,
});

export default {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  RewardedAd,
  AppOpenAd,
  AdEventType,
  RewardedAdEventType,
  TestIds,
};
