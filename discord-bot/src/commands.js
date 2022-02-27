function parseArgs(content, params, splitter) { //interprets a user's command and outputs a JSON of arguments
    let args = content.split(splitter);
    if (args[0] === "") {
        args.splice(0,1);
    }
    if (args.length > params.length) {
        throw new Error(`Too many arguments`);
    }
    
    //creates a stringified JSON using the command's parameters and the user's arguments
    let argJSON = "{";
    for (let i = 0; i < args.length; i++) {
        argJSON += `"${params[i]}":"${args[i]}",`;
    }
    for (let i = args.length; i < params.length; i++) {
        argJSON += `"${params[i]}":null,`;
    }
    if (argJSON !== "{") {
        argJSON = argJSON.slice(0, -1);
    }
    argJSON += "}";

    return JSON.parse(argJSON);
}

class Command { //framework for discord commands
    constructor(name, description, params, execution, errorHandle, splitter = "\u0000") {
        this.name = name; //the string that triggers the command
        this.description = description; //a description of the command
        this.params = params; //an array of parameter names for commands that require arguments
        this.execute = function(msg) { //run the execution function if a message triggers the command
            if (msg.content.startsWith(name)) {
                try {
                    execution(msg, parseArgs(msg.content.substring(name.length), params, splitter));
                } catch (e) {
                    errorHandle(msg, e);
                }
            }
        };
    }
}

module.exports = Command;