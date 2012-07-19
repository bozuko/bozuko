If the PUT or POST  command is successful, the success property will be true.

If it is false, the **errors** property will be a hash with the submitted
parameter names as keys, and the error message as value. If the parameter is
an array, like **prizes**, the value would be an array of hashes. Array objects
without errors will be Boolean false.

If there is an error that doesn't directly coorespond with a submitted value,
then **errors** will be an empty hash, and **error** will be populated with a message.