require('dotenv').config()
const { Client, Intents } = require('discord.js');
const client = new Client({intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES"]});

let ids = {};
let previousIds = {};

function getMassbanString(idsObject, prefixesArray) {
  let prefixes = [];
  let previousPrefix;
  let previousPrefixCount = 0;
  let idsToBan = [];
  let massbanString = "";

  if (!prefixesArray) {
    for (const id in idsObject) {
      const prefix = idsObject[id];

      if (prefix == previousPrefix || Number(prefix) - 1 == Number(previousPrefix) || Number(prefix) + 1 == Number(previousPrefix)) {
        previousPrefixCount += 1;
      }

      if (previousPrefixCount == 5) {
        if (!prefixes.includes(prefix)) {
          prefixes.push(prefix);
        }
        previousPrefixCount = 0;
      }

      previousPrefix = prefix;
    }

    for (const id in idsObject) {
      if (prefixes.includes(idsObject[id]) || prefixes.includes(String(Number(idsObject[id]) - 1)) || prefixes.includes(String(Number(idsObject[id]) - 1))) {
        idsToBan.push(id);
      }
    }
  } else {
    for (const id in idsObject) {
      if (prefixesArray.includes(idsObject[id]) || prefixesArray.includes(String(Number(idsObject[id]) - 1)) || prefixesArray.includes(String(Number(idsObject[id]) - 1))) {
        idsToBan.push(id);
      }
    }
  }

  for (let i = 0; i < idsToBan.length; i++) {
    if (i == 0) {
      massbanString += ",massban " + idsToBan[i];
    } else if (i % 100 == 0) {
      massbanString += "\n,massban " + idsToBan[i];
    } else {
      massbanString += " " + idsToBan[i];
    }
  }

  return [massbanString, prefixes];
}

function diffPrefixes(p1, p2) {
  let a1 = p1.concat(p2).filter(i => !p1.includes(i) || !p2.includes(i));
  return a1.concat(p1).filter(i => !a1.includes(i) || !p1.includes(i));
}


function sendToChannel(massbanString, notify) {
  if (notify) {
    client.channels.cache.get(process.env.CHANNEL_ID).send("<@&" + process.env.ROLE_ID + ">" + " New raid, come ban them!");
  }

  let massbans = massbanString.split("\n");

  for (let i = 0; i < massbans.length; i++) {
    client.channels.cache.get(process.env.CHANNEL_ID).send(massbans[i]);
  }
}

function checkIds() {
  let [massbanString, prefixes] = getMassbanString(ids);

  if (massbanString != "") {
    sendToChannel(massbanString, true);

    if (previousIds["prefixes"]) {
      let prefixArray = diffPrefixes(previousIds["prefixes"], prefixes);
      sendToChannel(getMassbanString(previousIds, prefixArray)[0]);
    }

    previousIds = ids;
    previousIds["prefixes"] = prefixes;
    ids = {};
  }
}

setInterval(checkIds, 60000); //change to 600000 in production

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
})

/* Production
client.on('guildMemberAdd', member => {
  let id = String(member.id);
  ids[id] = id.substring(0, 4);
});
*/

// Development
client.on("messageCreate", (message) => {
  if (!(message.author.id === client.user.id)) {
    let id = String(message.content);
    ids[id] = id.substring(0, 4);
  }
});

client.login(process.env.BOT_TOKEN)
