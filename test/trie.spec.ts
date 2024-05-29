import { test } from 'vitest';


const iterations = 1000;

const inputText = "This is a test with tag1 and another tag2. This text the brown includes some random words along with tag1, tag2, and maybe tag3. Here is some more text and some even more tag4 text. The end.";

const tags = new Array(1000).fill(0).map((_, i) => `tag${i + 1}`);


class TrieNode {
  children: { [key: string]: TrieNode } = {};
  isEndOfWord: boolean = false;
  id = 0;
}

class Trie {
  root: TrieNode = new TrieNode();

  insert(word: string, tagId: number): void {
    let node: TrieNode = this.root;
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
    node.id = tagId;
  }

  search(text: string): Set<{ tag: string, id: number }> {
    const detectedTags: Set<{ tag: string, id: number }> = new Set();
    for (let i = 0; i < text.length; i++) {
      let node: TrieNode = this.root;
      for (let j = i; j < text.length; j++) {
        const char: string = text[j];
        if (!node.children[char]) {
          break;
        }
        node = node.children[char];
        if (node.isEndOfWord) {
          detectedTags.add({ tag: text.slice(i, j + 1), id: node.id! });
        }
      }
    }
    return detectedTags;
  }
}

const trie: Trie = new Trie();
tags.forEach((tag, i) => trie.insert(tag.toLowerCase(), i));

function trieProcessInput(inputText: string): Set<{ tag: string, id: number }> {
  return trie.search(inputText.toLowerCase());
}

function arrayLookup(inputText: string) {
  return tags.filter(tag => inputText.includes(tag));
}




test('should measure Trie performance', () => {
  const startTime = process.hrtime.bigint();

  for (let i = 0; i < iterations; i++) {
    trieProcessInput(inputText);
  }

  const endTime = process.hrtime.bigint();
  const duration = Number(endTime - startTime) / 1e6; // convert nanoseconds to milliseconds

  console.log(`Trie: Time taken for ${iterations} iterations: ${duration.toFixed(2)} ms`);
});

test('should measure Array lookup performance', () => {
  const startTime = process.hrtime.bigint();

  for (let i = 0; i < iterations; i++) {
    arrayLookup(inputText);
  }

  const endTime = process.hrtime.bigint();
  const duration = Number(endTime - startTime) / 1e6; // convert nanoseconds to milliseconds

  console.log(`Array Lookup: Time taken for ${iterations} iterations: ${duration.toFixed(2)} ms`);
});