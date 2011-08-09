module.exports = {
    plays_entries_tokens: 'total plays must equal total_entries * tokens + free plays',

    no_prizes: "There must be at least one prize for this game",

    email_codes: "Prize: "+this.data+" - Number of email codes must match total number of prizes",

    email_body: 'Prize: '+this.data+' -Email body cannot be empty',

    barcodes_length: 'Prize: '+this.data+' - Number of barcodes does not equal prize total',

    barcodes_s3: 'Prize: '+this.data+' - Barcodes were not properly stored on S3'
};
