// Bit Reader


function BitReader(arrayBuffer) {
    var that = this;
    that.bytes = new Uint8Array(arrayBuffer);
    that.length = that.bytes.length;
    that.writePos = that.bytes.length;
    that.index = 0;
}


BitReader.NOT_FOUND = -1;


BitReader[PROTOTYPE].findNextMPEGStartCode = function() {

    var that = this;

    for( var i = (that.index+7 >> 3); i < that.writePos; i++ ) {
        if(
            that.bytes[i] == 0x00 &&
            that.bytes[i+1] == 0x00 &&
            that.bytes[i+2] == 0x01
        ) {
            that.index = (i+4) << 3;
            return that.bytes[i+3];
        }
    }
    that.index = (that.writePos << 3);
    return BitReader.NOT_FOUND;
};


BitReader[PROTOTYPE].nextBytesAreStartCode = function() {
    var that = this;
    var i = (that.index+7 >> 3);
    return (
        i >= that.writePos || (
            that.bytes[i] == 0x00 && 
            that.bytes[i+1] == 0x00 &&
            that.bytes[i+2] == 0x01
        )
    );
};


BitReader[PROTOTYPE].nextBits = function(count) {

    var that = this;

    var 
        byteOffset = that.index >> 3,
        room = (8 - that.index % 8);

    if( room >= count ) {
        return (that.bytes[byteOffset] >> (room - count)) & (0xff >> (8-count));
    }

    var 
        leftover = (that.index + count) % 8, // Leftover bits in last byte
        end = (that.index + count -1) >> 3,
        value = that.bytes[byteOffset] & (0xff >> (8-room)); // Fill out first byte

    for( byteOffset++; byteOffset < end; byteOffset++ ) {
        value <<= 8; // Shift and
        value |= that.bytes[byteOffset]; // Put next byte
    }

    if (leftover > 0) {
        value <<= leftover; // Make room for remaining bits
        value |= (that.bytes[byteOffset] >> (8 - leftover));
    }
    else {
        value <<= 8;
        value |= that.bytes[byteOffset];
    }
    
    return value;
};


BitReader[PROTOTYPE].getBits = function(count) {
    var that = this;
    var value = that.nextBits(count);
    that.index += count;
    return value;
};


BitReader[PROTOTYPE].advance = function(count) {
    return (this.index += count);
};


BitReader[PROTOTYPE].rewind = function(count) {
    return (this.index -= count);
};



























