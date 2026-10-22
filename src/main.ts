import { pickStorage } from './storage/local';
import { mountApp } from './ui/app';

const root = document.getElementById('app');
if (!root) throw new Error('#app not found');
const { storage, persistent } = pickStorage();
mountApp(root, storage, persistent);
