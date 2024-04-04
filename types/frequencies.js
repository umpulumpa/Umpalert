class Frequencies {
    static ONE_TIME = { id: 1, name: 'one-time' };
    static DAILY = { id: 2, name: 'daily' };
    static WEEKLY = { id: 3, name: 'weekly' };
    static MONTHLY = { id: 4, name: 'monthly' };
    
    static getFrequencyTypeById(id) {
        return Object.values(Frequencies).find(type => type.id === id);
    }

    static getFrequencyTypeByName(name) {
        return Object.values(Frequencies).find(type => type.name === name);
    }

    static getAllFrequencyTypes() {
        return Object.values(Frequencies);
    }
}

module.exports = Frequencies;