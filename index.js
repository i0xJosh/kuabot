const { Client, GatewayIntentBits, EmbedBuilder, Partials, AttachmentBuilder } = require('discord.js');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Configuración
const canalSugerencias = '1114832624440066188';
const canalRevision = '1086721613661224980';
const canalImagenes = '1395658867018563644';
const allowedUsers = ['1064060467024253009', '801530609805557791'];
const token = 'MTMxNDY5MjUyNjYxNTE3MTE3Mw.G523FL.Ya2s-VEH8IBsv8hitxuC3FhNTQ32y7xv4j9PO0';

const imgs = {
  aceptada: path.resolve('img/aceptado.png'),
  rechazada: path.resolve('img/rechazada.png'),
  consideracion: path.resolve('img/consideracion.png'),
};

const estados = new Map();

// Almacenar reacciones de usuarios en mensajes públicos
const userReactions = new Map();

client.once('ready', () => {
  console.log(` Bot listo y conectado como ${client.user.tag}`);
});

async function pedirRazon(user, channel) {
  const promptMsg = await channel.send(`${user}, por favor escribe el motivo para esta acción (una sola vez).`);
  const filter = m => m.author.id === user.id;
  const collected = await channel.awaitMessages({ filter, max: 1, time: 30000 });
  const razon = collected.first()?.content || 'Sin motivo proporcionado.';

  // Borra el mensaje del bot y del usuario
  await promptMsg.delete().catch(() => {});
  if (collected.first()) await collected.first().delete().catch(() => {});

  return razon;
}

client.on('messageCreate', async (message) => {
  if (message.channel.id !== canalSugerencias || message.author.bot) return;

  const embed = new EmbedBuilder()
    .setTitle('📨 Nueva Sugerencia')
    .setColor('Yellow')
    .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: `Enviada por ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
    .addFields({ name: 'Enviada por', value: message.author.tag, inline: true });

  // Si tiene contenido de texto, agregarlo a la descripción
  if (message.content) {
    embed.setDescription(message.content);
  }

  let storedImageUrl = null;

  // Si tiene imagen adjunta, enviarla al canal de imágenes
  if (message.attachments.size > 0) {
    const attachment = message.attachments.find(att => 
      att.contentType?.startsWith('image/') || 
      att.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    );
    
    if (attachment) {
      try {
        // Enviar la imagen al canal de almacenamiento
        const canalAlmacenamiento = await client.channels.fetch(canalImagenes);
        const imageMessage = await canalAlmacenamiento.send({
          content: `📸 Imagen de sugerencia por ${message.author.tag} (ID: ${message.id})`,
          files: [attachment]
        });
        
        // Guardar la URL de la imagen almacenada
        storedImageUrl = imageMessage.attachments.first().url;
        
        // Mostrar la imagen en el embed original
        embed.setImage(storedImageUrl);
        
        console.log(`✅ Imagen almacenada en canal ${canalImagenes}: ${storedImageUrl}`);
      } catch (error) {
        console.error('❌ Error al almacenar imagen:', error);
        // Si falla, usar la imagen original
        embed.setImage(attachment.url);
        storedImageUrl = attachment.url;
      }
    }
  }

  const canal = await client.channels.fetch(canalRevision);
  const msg = await canal.send({ embeds: [embed] });

  await msg.react('✅');
  await msg.react('🧠');
  await msg.react('❌');

  estados.set(msg.id, {
    estado: 'pendiente',
    puedeReaccionar: true,
    razonRegistrada: false
  });

  // Guardar datos de la sugerencia incluyendo la URL de la imagen almacenada
  msg.suggestionData = {
    authorId: message.author.id,
    originalContent: message.content,
    storedImageUrl: storedImageUrl, // URL de la imagen en el canal de almacenamiento
  };

  // Eliminar el mensaje original del canal de sugerencias
  message.delete().catch(() => {});
});


client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  
  if (reaction.partial) await reaction.fetch();
  if (reaction.message.partial) await reaction.message.fetch();

  const message = reaction.message;
  if (!message.embeds || !message.embeds.length) return;

  // Verificar si es un mensaje público de sugerencia (canal de sugerencias)
  if (message.channel.id === canalSugerencias) {
    const emoji = reaction.emoji.name;
    
    // Manejar reacción de hilo
    if (emoji === '🧵') {
      if (message.hasThread) return; // Si ya tiene hilo, no crear otro
      
      try {
        const thread = await message.startThread({
          name: `💬 Discusión de sugerencia`,
          autoArchiveDuration: 1440, // 24 horas
          reason: 'Hilo de discusión para sugerencia'
        });
        
        await thread.send('¡Hilo creado para discutir esta sugerencia! 💬');
        return;
      } catch (error) {
        console.error('Error al crear hilo:', error);
        return;
      }
    }
    
    // Manejar reacciones de votación (👍, 🧠, 👎)
    if (['👍', '🧠', '👎'].includes(emoji)) {
      const messageId = message.id;
      const userId = user.id;
      
      // Obtener la reacción anterior del usuario en este mensaje
      const userPreviousReaction = userReactions.get(`${messageId}-${userId}`);
      
      // Si el usuario ya reaccionó con otra cosa, removerla
      if (userPreviousReaction && userPreviousReaction !== emoji) {
        const previousReaction = message.reactions.cache.find(r => r.emoji.name === userPreviousReaction);
        if (previousReaction) {
          await previousReaction.users.remove(userId);
        }
      }
      
      // Guardar la nueva reacción del usuario
      userReactions.set(`${messageId}-${userId}`, emoji);
      return;
    }
    
    // Si no es una reacción válida en mensaje público, removerla
    await reaction.users.remove(user.id);
    return;
  }

  // Verificar si es mensaje de moderación
  if (!allowedUsers.includes(user.id)) {
    await reaction.users.remove(user.id);
    return;
  }

  const estadoActual = estados.get(message.id);
  if (!estadoActual || !estadoActual.puedeReaccionar) {
    await reaction.users.remove(user.id);
    return;
  }

  const emoji = reaction.emoji.name;
  const embed = EmbedBuilder.from(message.embeds[0]);

  if (!['✅', '❌', '🧠'].includes(emoji)) {
    await reaction.users.remove(user.id);
    return;
  }

  const esAceptar = emoji === '✅';
  const esRechazar = emoji === '❌';
  const esConsideracion = emoji === '🧠';

  let razon = 'Sin motivo proporcionado.';

  if (esConsideracion && !estadoActual.razonRegistrada) {
    razon = await pedirRazon(user, reaction.message.channel);
    estadoActual.razonRegistrada = true;
    estadoActual.razonConsideracion = razon;
  } else if (!esConsideracion && !estadoActual.razonRegistrada) {
    razon = await pedirRazon(user, reaction.message.channel);
  } else if (!esConsideracion && estadoActual.razonRegistrada) {
    razon = estadoActual.razonConsideracion || 'Sin motivo proporcionado.';
  }

  if (esConsideracion) {
    const autor = await client.users.fetch(message.suggestionData.authorId);

embed
  .setColor('Yellow')
  .setTitle('🧠 Sugerencia Considerada')
  .setAuthor({ name: autor.tag, iconURL: autor.displayAvatarURL({ dynamic: true }) })
  .setThumbnail('attachment://' + path.basename(imgs.consideracion))
  .setFooter({ text: `Considerada por ${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
  .setFields([
    { name: 'Motivo', value: razon },
  ]);



      

    // Si hay imagen almacenada, mantenerla en el embed
    if (message.suggestionData.storedImageUrl) {
      embed.setImage(message.suggestionData.storedImageUrl);
    }

    await message.edit({ 
      embeds: [embed], 
      files: [new AttachmentBuilder(imgs.consideracion)]
    });

    await message.reactions.removeAll();
    await message.react('✅');
    await message.react('❌');

    estados.set(message.id, {
      estado: 'consideracion',
      puedeReaccionar: true,
      razonRegistrada: estadoActual.razonRegistrada,
      razonConsideracion: razon
    });

    // Publicar en canal público
    const canalPublico = await client.channels.fetch(canalSugerencias);
    const embedPublico = new EmbedBuilder()
      .setColor('Yellow')
      .setTitle('🧠 Sugerencia Considerada')
      .setDescription(message.suggestionData.originalContent)
      .setAuthor({ name: autor.tag, iconURL: autor.displayAvatarURL({ dynamic: true }) })
      .setThumbnail('attachment://' + path.basename(imgs.consideracion))
      .setFooter({ text: `Considerada por ${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
      .setFields({ name: 'Motivo', value: razon });

    // Si hay imagen almacenada, mostrarla en el mensaje público
    if (message.suggestionData.storedImageUrl) {
      embedPublico.setImage(message.suggestionData.storedImageUrl);
    }

    const msgPublico = await canalPublico.send({ 
      embeds: [embedPublico], 
      files: [new AttachmentBuilder(imgs.consideracion)]
    });
    
    await msgPublico.react('👍');
    await msgPublico.react('🧠');
    await msgPublico.react('👎');
    await msgPublico.react('🧵');

    try {
      const embedDM = new EmbedBuilder()
        .setColor('Yellow')
        .setTitle('🧠 Tu sugerencia está siendo considerada')
        .setDescription(message.suggestionData.originalContent)
        .setThumbnail('attachment://' + path.basename(imgs.consideracion))
        .addFields({ name: 'Motivo', value: razon });
      await autor.send({ embeds: [embedDM], files: [new AttachmentBuilder(imgs.consideracion)] });
    } catch {}

  } else {
    estadoActual.estado = esAceptar ? 'aceptada' : 'rechazada';
    estadoActual.puedeReaccionar = false;

    let attachmentFile = new AttachmentBuilder(esAceptar ? imgs.aceptada : imgs.rechazada);
    let thumbnailURL = 'attachment://' + path.basename(esAceptar ? imgs.aceptada : imgs.rechazada);

    const autor = await client.users.fetch(message.suggestionData.authorId);

    embed
      .setColor(esAceptar ? 'Green' : 'Red')
      .setTitle(esAceptar ? '✅ Sugerencia Aprobada' : '❌ Sugerencia Rechazada')
      .setAuthor({ name: autor.tag, iconURL: autor.displayAvatarURL({ dynamic: true }) })
      .setThumbnail(thumbnailURL)
      .setFooter({ text: `${esAceptar ? 'Aprobada' : 'Rechazada'} por ${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
      .setFields([
        { name: 'Motivo', value: razon }
      ]);

    // Si hay imagen almacenada, mantenerla en el embed
    if (message.suggestionData.storedImageUrl) {
      embed.setImage(message.suggestionData.storedImageUrl);
    }

    await message.edit({ embeds: [embed], files: [attachmentFile] });
    await message.reactions.removeAll();
      
    if (esAceptar) {
      const canalPublico = await client.channels.fetch(canalSugerencias);

      const embedPublico = new EmbedBuilder()
        .setColor('Green')
        .setTitle('✅ Sugerencia Aprobada')
        .setDescription(message.suggestionData.originalContent)
        .setAuthor({ name: autor.tag, iconURL: autor.displayAvatarURL({ dynamic: true }) })
        .setThumbnail('attachment://' + path.basename(imgs.aceptada))
        .setFooter({ text: `Aprobada por ${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
        .setFields({ name: 'Motivo', value: razon });

      // Si hay imagen almacenada, mostrarla en el mensaje público
      if (message.suggestionData.storedImageUrl) {
        embedPublico.setImage(message.suggestionData.storedImageUrl);
      }

      const msg = await canalPublico.send({ 
        embeds: [embedPublico], 
        files: [new AttachmentBuilder(imgs.aceptada)]
      });
      
      await msg.react('👍');
      await msg.react('🧠');
      await msg.react('👎');
      await msg.react('🧵');

      if (!estadoActual.razonRegistrada) {
        try {
          const embedDM = new EmbedBuilder()
            .setColor('Green')
            .setTitle('✅ Tu sugerencia fue aprobada')
            .setDescription(message.suggestionData.originalContent)
            .setThumbnail('attachment://' + path.basename(imgs.aceptada))
            .setFields([{ name: 'Motivo', value: razon }]);
          await autor.send({ embeds: [embedDM], files: [new AttachmentBuilder(imgs.aceptada)] });
        } catch {}
      }
      
    } else {
      if (!estadoActual.razonRegistrada) {
        try {
          const embedDM = new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Tu sugerencia fue denegada')
            .setDescription(message.suggestionData.originalContent)
            .setThumbnail('attachment://' + path.basename(imgs.rechazada))
            .setFields([{ name: 'Motivo', value: razon }]);
          await autor.send({ embeds: [embedDM], files: [new AttachmentBuilder(imgs.rechazada)] });
        } catch {}
      }
    }

    estados.set(message.id, estadoActual);
  }
});

require('./reaction.js')(client);
require('./msj.js')(client);

client.login(token);