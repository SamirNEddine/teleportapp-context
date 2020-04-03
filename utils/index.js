const config = function () {
    //Array
    Array.prototype.insertASCSorted = function(value){
        let i = 0;
        while(this[i] < value){
            i++;
        }
        this.splice(i, 0, value);
    };
};

module.exports.config = config;