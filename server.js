const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'history.json');
const SOLUTION_FILE = path.join(__dirname, 'solutionhistory.json');

app.use(express.json());
app.use(express.static('public'));

function readJsonFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify([]));
            return [];
        }
        const fileContent = fs.readFileSync(filePath, 'utf8').trim();
        if (!fileContent) return [];
        return JSON.parse(fileContent);
    } catch (err) {
        return [];
    }
}

app.get('/api/data', (req, res) => {
    const inventory = readJsonFile(DATA_FILE);
    const solutions = readJsonFile(SOLUTION_FILE);
    res.json({ inventory, solutions });
});

app.post('/api/add', (req, res) => {
    const { customId, productName, boardType, issueName, checkedBy, partNo } = req.body;
    if (!customId || !productName || !boardType || !issueName || !partNo) {
        return res.status(400).json({ error: 'All required fields must be filled!' });
    }

    let inventory = readJsonFile(DATA_FILE);

    if (inventory.some(item => item.id.toLowerCase() === customId.trim().toLowerCase())) {
        return res.status(400).json({ error: `Record ID "${customId.trim()}" is already taken!` });
    }
    if (inventory.some(item => item.partNo.toLowerCase() === partNo.trim().toLowerCase())) {
        return res.status(400).json({ error: `Part No "${partNo.trim()}" is already taken!` });
    }

    const newItem = {
        id: customId.trim(),
        productName: productName.trim(),
        boardType,
        issueName: issueName.trim(),
        checkedBy: checkedBy ? checkedBy.trim() : '',
        partNo: partNo.trim(),
        timestamp: new Date().toLocaleString()
    };

    inventory.push(newItem);
    fs.writeFileSync(DATA_FILE, JSON.stringify(inventory, null, 2));

    res.json({ inventory, solutions: readJsonFile(SOLUTION_FILE) });
});

app.post('/api/delete', (req, res) => {
    const { id } = req.body;
    let inventory = readJsonFile(DATA_FILE);
    const index = inventory.findIndex(item => item.id === id);
    if (index === -1) return res.status(404).json({ error: 'Item not found' });

    inventory.splice(index, 1);
    fs.writeFileSync(DATA_FILE, JSON.stringify(inventory, null, 2));

    res.json({ inventory, solutions: readJsonFile(SOLUTION_FILE) });
});

app.post('/api/add-solution', (req, res) => {
    const { issueKeyword, solutionText } = req.body;
    if (!issueKeyword || !solutionText) {
        return res.status(400).json({ error: 'Issue keyword and solution text required!' });
    }

    let solutions = readJsonFile(SOLUTION_FILE);
    const newSolution = {
        id: 'SOL-' + Date.now(),
        issueKeyword: issueKeyword.trim().toLowerCase(),
        solutionText: solutionText.trim(),
        timestamp: new Date().toLocaleString()
    };

    solutions.push(newSolution);
    fs.writeFileSync(SOLUTION_FILE, JSON.stringify(solutions, null, 2));

    res.json({ inventory: readJsonFile(DATA_FILE), solutions });
});

app.post('/api/delete-solution', (req, res) => {
    const { id } = req.body;
    let solutions = readJsonFile(SOLUTION_FILE);
    const index = solutions.findIndex(item => item.id === id);
    if (index === -1) return res.status(404).json({ error: 'Solution not found' });

    solutions.splice(index, 1);
    fs.writeFileSync(SOLUTION_FILE, JSON.stringify(solutions, null, 2));

    res.json({ inventory: readJsonFile(DATA_FILE), solutions });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});