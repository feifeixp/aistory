import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Since we are in a Node.js environment, we need to simulate the DOM
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="story-log"></div><input id="user-input" /><button id="submit-button"></button></body></html>');
global.document = dom.window.document;

// Now we can import the script
const script = require('./script.js');

describe('AI Text Adventure', () => {
    beforeEach(() => {
        // Reset the game state before each test
        script.player.currentLocation = "tavern";
        script.player.inventory = [];
        document.getElementById('story-log').innerHTML = '';
    });

    it('should start the game in the tavern', () => {
        expect(script.player.currentLocation).toBe('tavern');
        const storyLog = document.getElementById('story-log');
        expect(storyLog.textContent).toContain('You are in a dimly lit tavern.');
    });

    it('should allow the player to move to a new location', () => {
        script.generateStory('go north');
        expect(script.player.currentLocation).toBe('road');
        const storyLog = document.getElementById('story-log');
        expect(storyLog.textContent).toContain('You are on a dark, winding road.');
    });

    it('should allow the player to take an item', () => {
        script.generateStory('take key');
        expect(script.player.inventory).toContain('key');
        const storyLog = document.getElementById('story-log');
        expect(storyLog.textContent).toContain('You took the key.');
    });

    it('should allow the player to view their inventory', () => {
        script.generateStory('take key');
        script.generateStory('inventory');
        const storyLog = document.getElementById('story-log');
        expect(storyLog.textContent).toContain('You are carrying: key.');
    });

    it('should allow the player to win the game', () => {
        script.generateStory('go north');
        script.generateStory('go north');
        script.player.inventory.push('key');
        script.generateStory('use key');
        const storyLog = document.getElementById('story-log');
        expect(storyLog.textContent).toContain('You unlock the chest. Inside, you find a golden chalice. You win!');
    });
});