require("dotenv").config();
const fetch = require("node-fetch");
const Discord = require("discord.js");
const Command = require("./commands.js");

const client = new Discord.Client();

const token = process.env.TOKEN;
const url = process.env.URL;
const invite = process.env.MENTOR_INVITE;

const Commands = [];

const WellnessMessage = new Discord.MessageEmbed().setDescription("We detected that a message you sent was a little"
    + " concerning and we wanted to make sure you're alright. If you need someone to talk to or seek support from,"
    + " you can use '.talk' to initiate an anonymous conversation between you and a mentor."
    + "\n\nAlso, don't be afraid to reach out to licensed professionals if you need — therapy and mental health services "
    + "are unfairly stigmatized in society but they can have a significant positive impact on your well-being.");

const WellnessCheck = msg => { //checks a message for concerning content, and sends a DM if needed
    if (msg.author.id !== client.user.id && !(msg.channel instanceof Discord.DMChannel)) {
        fetch(url + "/api/is-message-unhealthy", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: msg.content
            })
        }).then(response => response.json()).then(response => {
            if (response.status === "ok") {
                if (response.result === true) {
                    msg.author.send(WellnessMessage).catch(e => { });
                }
            }
        });
    }
};

Commands.push(new Command(".signup", "sign up to be a mentor", [], (msg, args) => {
    fetch(url + "/api/mentors", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userID: msg.author.id
        })
    }).then(response => {
        return response.json()
    }).then(response => {
        if (response.status === "ok") {
            msg.channel.send(new Discord.MessageEmbed().setTitle("You have successfully signed up as a mentor!"));
            msg.author.send(invite).catch(e => {
                if (e.message === "Cannot send messages to this user") {
                    msg.channel.send(new Discord.MessageEmbed().setDescription("Enable your DMs to receive an invite to our community of mentors!"));
                }
            })
        } else if (response.status === "already-signed-up") {
            msg.channel.send(new Discord.MessageEmbed().setDescription("You are already signed up as a mentor."));
        }
    })
}, (msg, e) => { }, / +/));

Commands.push(new Command(".withdraw", "withdraw from being a mentor", [], (msg, args) => {
    fetch(url + "/api/mentors", {
        method: "DELETE",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userID: msg.author.id
        })
    }).then(response => response.json()).then(response => {
        if (response.status === "ok") {
            msg.channel.send(new Discord.MessageEmbed().setTitle("You have successfully withdrawn from being a mentor!"));
        } else if (response.status === "id-does-not-exist") {
            msg.channel.send(new Discord.MessageEmbed().setDescription("You are not signed up as a mentor."));
        }
    })
}, (msg, e) => { }));

Commands.push(new Command(".feedback ", "give feedback to WellnessBot", ["message"], (msg, args) => {
    fetch(url + "/api/feedback", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userID: msg.author.id,
            message: args.message
        })
    }).then(response => response.json()).then(response => {
        msg.channel.send(new Discord.MessageEmbed().setTitle("Thank you for your feedback!"));
    });
}, (msg, e) => { }, "\u0000"));

Commands.push(new Command(".dnd", "turn on Do Not Disturb as a mentor, indefinitely or until a specified date/time", ["date"], (msg, args) => {
    if (args.date === null) {
        args.date = " always";
    }
    if (args.date.startsWith(" ")) {
        args.date = args.date.substring(1);
        fetch(url + "/api/mentors/do-not-disturb", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userID: msg.author.id,
                doNotDisturb: args.date
            })
        }).then(response => response.json()).then(response => {
            if (response.status === "ok") {
                if (response.date === null) {
                    msg.channel.send(new Discord.MessageEmbed().setTitle("Do Not Disturb has been turned on indefinitely.")
                        .setDescription("Use '.dndOff' to turn it off."));
                } else {
                    msg.channel.send(new Discord.MessageEmbed().setTitle(`Do Not Disturb has been turned on until ${response.date}.`)
                        .setDescription("Use '.dndOff' to turn it off."));
                }
            } else if (response.status === "invalid-date") {
                msg.channel.send(new Discord.MessageEmbed().setDescription("The date you provided could not be understood. Please try again."));
            } else if (response.status === "not-a-mentor") {
                msg.channel.send(new Discord.MessageEmbed().setDescription("You are not a mentor."));
            }
        });
    }
}, (msg, e) => { }, "\u0000"));

Commands.push(new Command(".dndOff", "turn off Do Not Disturb as a mentor", [], (msg, args) => {
    fetch(url + "/api/mentors/do-not-disturb", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userID: msg.author.id,
            doNotDisturb: "off"
        })
    }).then(response => response.json()).then(response => {
        if (response.status === "ok") {
            msg.channel.send(new Discord.MessageEmbed().setTitle("Do Not Disturb has been turned off."));
        } else if (response.status === "not-a-mentor") {
            msg.channel.send(new Discord.MessageEmbed().setDescription("You are not a mentor."));
        }
    });
}, (msg, e) => { }, / +/));

Commands.push(new Command(".talk", "begin an anonymous conversation with a mentor", [], (msg, args) => {
    fetch(url + "/api/mentors/available", { method: "GET" })
        .then(response => response.json()).then(response => {
            if (response.mentors.length === 0) {
                msg.channel.send("There are no mentors currently available.");
            } else {
                client.users.fetch(response.mentors[Math.floor(Math.random() * response.mentors.length)].userID).then(mentor => {
                    mentor.send(".").then(dmTest => {
                        dmTest.delete();
                        fetch(url + "/api/mentors/conversation", {
                            method: "POST",
                            headers: {
                                "Accept": "application/json",
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                userID: mentor.id,
                                client: msg.author.id
                            })
                        }).then(response => response.json()).then(response => {
                            if (response.status === "ok") {
                                mentor.send(new Discord.MessageEmbed()
                                    .setTitle("Someone has started an anonymous conversation with you.")).then(a => {
                                        msg.author.send(new Discord.MessageEmbed()
                                            .setTitle("You have started an anonyous conversation with a mentor.")
                                            .setDescription("Any message you send in this DM will be forwarded to your mentor."
                                                + "\nFeel free to discuss anything that might be bothering you or causing you stress"
                                                + " — remember, your mentor is here to help you and provide support."));
                                    });
                            } else if (response.status === "client-in-conversation") {
                                msg.channel.send(new Discord.MessageEmbed().setDescription("You are already in a conversation with a mentor."));
                            } else if (response.status === "client-is-mentor") {
                                msg.channel.send(new Discord.MessageEmbed().setDescription("A mentor cannot seek a conversation with a mentor.\nUse '.withdraw' to stop being a mentor."));
                            } else if (response.status === "not-a-mentor" || response.status === "mentor-in-conversation" || response.status === "mentor-is-dnd") {
                                msg.channel.send(new Discord.MessageEmbed().setDescription("We're sorry, an error occurred on our part.\nPlease try your command again."));
                            }
                        });
                    }).catch(e => {
                        msg.channel.send(new Discord.MessageEmbed().setDescription("We're sorry, an error occurred on our part.\nPlease try your command again."));
                    });
                });

            }
        })
}, (msg, e) => { }, / +/));

Commands.push(new Command(".end", "end an anonymous conversation", [], (msg, args) => {
    fetch(url + "/api/mentors/conversation/lookup/" + msg.author.id, { method: "GET" })
        .then(response => response.json()).then(response => {
            if (response.status === "ok") {
                let mentor = msg.author.id;
                if (response.isMentor) {
                    mentor = response.userID;
                }
                fetch(url + "/api/mentors/conversation", {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        userID: mentor,
                        client: null
                    })
                }).then(endResponse => endResponse.json()).then(endResponse => {
                    if (endResponse.status === "ok") {
                        msg.author.send(new Discord.MessageEmbed().setTitle("You have ended your conversation."));
                        client.users.fetch(response.userID).then(other => {
                            other.send(new Discord.MessageEmbed().setTitle("Your conversation has ended.")).catch(e => { });
                        });
                    }
                })
            } else if (response.status === "not-in-conversation") {
                msg.channel.send(new Discord.MessageEmbed().setDescription("You are not currently in a conversation."));
            }
        })
}));

const Help = new Command(".help", "", [], (msg, args) => {
    const e = new Discord.MessageEmbed()
        .setColor("#aaaaaa")
        .setTitle("WellnessBot Commands");
    for (c of Commands) {
        e.addField(c.name, c.description);
        if (c.params.length !== 0) {
            e.fields[e.fields.length - 1].name += ` <${c.params}>`;
        }
    }
    msg.channel.send(e);
}, (msg, e) => { console.log(e) }, / +/);

const Talk = msg => { //passes a DM message between a mentor and client
    if (msg.channel instanceof Discord.DMChannel && !msg.content.startsWith(".")) {
        fetch(url + "/api/mentors/conversation/lookup/" + msg.author.id, { method: "GET" })
            .then(response => response.json()).then(response => {
                if (response.status === "ok") {
                    client.users.fetch(response.userID).then(other => {
                        other.send(msg.content).catch(e => {
                            msg.channel.send(new Discord.MessageEmbed("An error occured; your message could not be sent."));
                        });
                    });
                }
            });
    }
}

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("message", msg => {
    if (msg.content !== "") { //runs through all command checks if the message sent contains text
        Help.execute(msg);
        for (c of Commands) {
            c.execute(msg);
        }
        WellnessCheck(msg);
        Talk(msg);
    }
});

client.login(token);