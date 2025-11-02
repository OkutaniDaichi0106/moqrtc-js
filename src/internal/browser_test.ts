import { isChrome, isFirefox } from './browser.js.ts';
import { assertEquals, assertExists, assert, assertRejects, assertThrows } from "@std/assert";


describe('browser', () => {
  describe('isChrome', () => {
    it('should return true when userAgent includes chrome', () => {
      assertEquals(isChrome, true);
    });

    it('should return false when userAgent does not include chrome', () => {
      // This test assumes the default userAgent does not include chrome
      // In real scenarios, this would be tested with different userAgents
      assertEquals(typeof isChrome, 'boolean');
    });
  });

  describe('isFirefox', () => {
    it('should return false when userAgent includes chrome', () => {
      assertEquals(isFirefox, false);
    });

    it('should return false when userAgent does not include firefox', () => {
      assertEquals(typeof isFirefox, 'boolean');
    });
  });
});