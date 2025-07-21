const { EmbedBuilder } = require('discord.js');

const selectedMessages = new Map();
const reactionRoles = new Map();
const exclusiveMessages = new Set(); // Mensajes donde solo se puede elegir 1 reacción
const allowedUsers = ['1064060467024253009', '801530609805557791'];

module.exports = (client) => {

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Comando para seleccionar mensaje
    if (message.content.toLowerCase().startsWith('-message')) {
      if (!allowedUsers.includes(message.author.id)) {
        return message.reply('❌ No tienes permisos para usar este comando.').catch(console.error);
      }

      const args = message.content.split(' ');
      if (args.length < 2) {
        return message.reply('❌ Uso correcto: `-message [ID_del_mensaje]`').catch(console.error);
      }

      const messageId = args[1];

      try {
        let targetMessage = null;
        let foundChannel = null;

        for (const [channelId, channel] of message.guild.channels.cache) {
          if (channel.isTextBased()) {
            try {
              targetMessage = await channel.messages.fetch(messageId);
              foundChannel = channel;
              break;
            } catch (error) { continue; }
          }
        }

        if (!targetMessage) {
          return message.reply('❌ No se pudo encontrar el mensaje con ese ID en ningún canal.').catch(console.error);
        }

        selectedMessages.set(message.author.id, { message: targetMessage, channel: foundChannel });

        return message.reply(`✅ Mensaje seleccionado: \`${messageId}\`\n📍 Canal: ${foundChannel}\nAhora puedes usar:\n• \`-add [emoji] @rol\` - Normal\n• \`-add [emoji] @rol exclusive\` - Solo 1 reacción\n• \`-addmasive\` - Múltiples normales\n• \`-addmasive exclusive\` - Múltiples con solo 1 reacción`).catch(console.error);

      } catch (error) {
        console.error('Error al buscar y seleccionar mensaje:', error);
        return message.reply('❌ Error al buscar el mensaje. Verifica el ID.').catch(console.error);
      }
    }

    // Comando para añadir una reacción individual
    if (message.content.toLowerCase().startsWith('-add')) {
      if (!allowedUsers.includes(message.author.id)) {
        return message.reply('❌ No tienes permisos para usar este comando.').catch(console.error);
      }

      if (!selectedMessages.has(message.author.id)) {
        return message.reply('❌ Primero debes seleccionar un mensaje con `-message [ID]`').catch(console.error);
      }

      const args = message.content.split(' ');
      if (args.length < 3) {
        return message.reply('❌ Uso correcto: `-add [emoji] @rol [exclusive]`\n`exclusive` es opcional - hace que solo se pueda elegir 1 reacción del mensaje').catch(console.error);
      }

      const emojiInput = args[1];
      const roleInput = args[2];
      const isExclusive = args[3] && args[3].toLowerCase() === 'exclusive';

      try {
        const result = await addSingleReaction(message, emojiInput, roleInput, false, isExclusive);
        if (result.success) {
          const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('✅ Reaction Role Añadido')
            .addFields(
              { name: '📍 Canal', value: result.channel.toString(), inline: true },
              { name: '📨 Mensaje ID', value: result.messageId, inline: true },
              { name: '😀 Emoji', value: emojiInput, inline: true },
              { name: '🎭 Rol Asociado', value: result.role.toString(), inline: true },
              { name: '🔒 Modo', value: isExclusive ? '**Exclusivo** (1 reacción por usuario)' : '**Normal** (múltiples reacciones)', inline: false },
              { name: '📝 Nota', value: 'El mensaje sigue seleccionado para más comandos', inline: false }
            );

          await message.reply({ embeds: [embed] }).catch(console.error);
        }
      } catch (error) {
        console.error('Error en -add:', error);
        return message.reply('❌ Ocurrió un error al configurar el reaction role.').catch(console.error);
      }
    }

    // Comando para añadir múltiples reacciones masivamente
    if (message.content.toLowerCase().startsWith('-addmasive')) {
      if (!allowedUsers.includes(message.author.id)) {
        return message.reply('❌ No tienes permisos para usar este comando.').catch(console.error);
      }

      if (!selectedMessages.has(message.author.id)) {
        return message.reply('❌ Primero debes seleccionar un mensaje con `-message [ID]`').catch(console.error);
      }

      const args = message.content.split(' ');
      const isExclusive = args[1] && args[1].toLowerCase() === 'exclusive';

      // Respuesta simple sin embed
      const confirmMsg = await message.reply(`📝 **Configuración Masiva** ${isExclusive ? '(Modo Exclusivo)' : '(Modo Normal)'}\n\n**Formato esperado:**\n\`\`\`\n😀 @Brasil\n⚡ @Avanzado\n🎮 @Gamer\n\`\`\`\n\nEnvía tu mensaje ahora (60 segundos). Escribe "cancelar" para cancelar.`);

      const filter = (m) => m.author.id === message.author.id && m.channel.id === message.channel.id;
      const collector = message.channel.createMessageCollector({ 
        filter, 
        time: 60000, 
        max: 1 
      });

      collector.on('collect', async (collectedMessage) => {
        try {
          if (collectedMessage.content.toLowerCase().trim() === 'cancelar') {
            return message.reply('❌ Configuración masiva cancelada.');
          }

          // Verificar que la selección aún existe
          if (!selectedMessages.has(message.author.id)) {
            return message.reply('❌ Error: Se perdió la selección del mensaje. Usa `-message [ID]` de nuevo.');
          }

          console.log(`🔍 Procesando mensaje masivo de ${message.author.tag}:`);
          console.log(`Contenido: "${collectedMessage.content}"`);

          const lines = collectedMessage.content.trim().split('\n').filter(line => line.trim().length > 0);
          console.log(`📝 Líneas encontradas: ${lines.length}`);

          if (lines.length === 0) {
            return message.reply('❌ No se encontraron líneas válidas. Usa el formato: `emoji @rol` (una por línea)');
          }

          const results = [];
          let errors = [];

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            console.log(`📝 Procesando línea ${i + 1}: "${line}"`);

            const parts = line.split(' ').filter(part => part.trim().length > 0);
            
            if (parts.length < 2) {
              errors.push(`Línea ${i + 1}: Formato inválido - se necesita emoji y rol`);
              continue;
            }

            const emoji = parts[0];
            const roleInput = parts.slice(1).join(' ');
            
            console.log(`🔍 Emoji: "${emoji}", Rol: "${roleInput}"`);

            try {
              // Verificar que la selección sigue existiendo antes de cada operación
              if (!selectedMessages.has(message.author.id)) {
                errors.push(`${emoji}: Se perdió la selección del mensaje`);
                continue;
              }
              
              const result = await addSingleReaction(message, emoji, roleInput, false, isExclusive);
              if (result.success) {
                results.push({ emoji, role: result.role });
                console.log(`✅ ${emoji} -> ${result.role.name} configurado exitosamente`);
              } else {
                errors.push(`${emoji}: ${result.error}`);
                console.log(`❌ ${emoji} falló: ${result.error}`);
              }
            } catch (error) {
              console.error(`Error procesando ${emoji}:`, error);
              errors.push(`${emoji}: Error al procesar - ${error.message}`);
            }
          }

          // Crear embed de resultados
          const selectedData = selectedMessages.get(message.author.id);
          if (!selectedData) {
            return message.reply('❌ Error: Se perdió la selección del mensaje durante el proceso.');
          }

          const resultEmbed = new EmbedBuilder()
            .setColor(results.length > 0 ? 'Green' : 'Red')
            .setTitle('📊 Resultado de Configuración Masiva');

          if (results.length > 0) {
            const successList = results.map(r => `${r.emoji} ➜ ${r.role}`).join('\n');
            resultEmbed.addFields({ name: `✅ Configurados (${results.length})`, value: successList.length > 1024 ? successList.substring(0, 1020) + '...' : successList, inline: false });
          }

          if (errors.length > 0) {
            const errorList = errors.slice(0, 10).join('\n');
            resultEmbed.addFields({ name: `❌ Errores (${errors.length})`, value: errorList.length > 1024 ? errorList.substring(0, 1020) + '...' : errorList, inline: false });
          }

          resultEmbed.addFields(
            { name: '📍 Canal', value: selectedData.channel.toString(), inline: true },
            { name: '📨 Mensaje ID', value: selectedData.message.id, inline: true },
            { name: '🔒 Modo', value: isExclusive ? '**Exclusivo** (1 reacción por usuario)' : '**Normal** (múltiples reacciones)', inline: false }
          );

          await message.reply({ embeds: [resultEmbed] });

        } catch (error) {
          console.error('Error en collector de addmasive:', error);
          message.reply('❌ Error procesando la configuración masiva.');
        }
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          message.reply('⏰ Tiempo agotado para la configuración masiva.\n📝 El mensaje sigue seleccionado para usar otros comandos.');
        }
      });

      return; // Importante: evitar que continúe procesando
    }

    // Comando para limpiar selección (opcional)
    if (message.content.toLowerCase() === '-clear') {
      if (!allowedUsers.includes(message.author.id)) {
        return message.reply('❌ No tienes permisos para usar este comando.').catch(console.error);
      }

      if (selectedMessages.has(message.author.id)) {
        selectedMessages.delete(message.author.id);
        return message.reply('✅ Selección de mensaje limpiada.').catch(console.error);
      } else {
        return message.reply('ℹ️ No tienes ningún mensaje seleccionado.').catch(console.error);
      }
    }
  });

  // Función auxiliar para añadir una sola reacción
  async function addSingleReaction(message, emojiInput, roleInput, deleteSelection = false, isExclusive = false) {
    const selectedData = selectedMessages.get(message.author.id);
    const targetMessage = selectedData.message;

    let role = null;
    if (roleInput.startsWith('<@&') && roleInput.endsWith('>')) {
      const roleId = roleInput.slice(3, -1);
      role = message.guild.roles.cache.get(roleId);
    } else {
      return { success: false, error: 'Debes mencionar el rol con @' };
    }

    if (!role) {
      return { success: false, error: 'No se pudo encontrar el rol' };
    }

    let emojiToReact = emojiInput;
    let emojiIdentifier = emojiInput;

    const customEmojiMatch = emojiInput.match(/^<a?:(\w+):(\d+)>$/);
    if (customEmojiMatch) {
      emojiToReact = customEmojiMatch[2];
      emojiIdentifier = emojiInput;
    }

    try {
      await targetMessage.react(emojiToReact);
    } catch (error) {
      console.error('Error al agregar la reacción:', error);
      return { success: false, error: 'Error al agregar la reacción' };
    }

    // Guardar la configuración de reaction role
    if (!reactionRoles.has(targetMessage.id)) {
      reactionRoles.set(targetMessage.id, new Map());
    }
    reactionRoles.get(targetMessage.id).set(emojiIdentifier, role.id);

    // Marcar el mensaje como exclusivo si es necesario
    if (isExclusive) {
      exclusiveMessages.add(targetMessage.id);
    }

    // Solo eliminar selección si se especifica explícitamente
    if (deleteSelection) {
      selectedMessages.delete(message.author.id);
    }

    return {
      success: true,
      role: role,
      channel: selectedData.channel,
      messageId: targetMessage.id
    };
  }

  // Evento cuando se añade una reacción
  client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    await fetchPartialData(reaction, reaction.message);

    const messageId = reaction.message.id;
    const emojiIdentifier = getEmojiIdentifier(reaction.emoji);

    console.log(`✅ Usuario ${user.tag} añadió reacción: ${emojiIdentifier}`);

    if (reactionRoles.has(messageId)) {
      const roleConfig = reactionRoles.get(messageId);
      const isExclusiveMessage = exclusiveMessages.has(messageId);
      
      if (roleConfig.has(emojiIdentifier)) {
        const roleId = roleConfig.get(emojiIdentifier);
        const role = reaction.message.guild.roles.cache.get(roleId);

        if (role) {
          try {
            // Refrescar la información del miembro para evitar problemas de cache
            const member = await reaction.message.guild.members.fetch({ user: user.id, force: true });
            
            // Si es mensaje exclusivo, remover otras reacciones del usuario primero
            if (isExclusiveMessage) {
              await removeOtherReactions(reaction.message, user, emojiIdentifier, member);
            }

            // Verificar si ya tiene el rol
            const hasRole = member.roles.cache.has(roleId);
            console.log(`🔍 Verificando rol "${role.name}" para ${user.tag}: ${hasRole ? 'Ya lo tiene' : 'No lo tiene'}`);

            if (!hasRole) {
              await member.roles.add(role);
              console.log(`✅ Rol "${role.name}" otorgado exitosamente a ${user.tag}`);
            } else {
              console.log(`ℹ️ El usuario ${user.tag} ya tenía el rol "${role.name}"`);
            }
          } catch (error) {
            console.error(`❌ Error al otorgar rol a ${user.tag}:`, error);
            console.error('Detalles del error:', error.message);
          }
        } else {
          console.log(`⚠️ No se encontró el rol con ID: ${roleId}`);
        }
      }
    }
  });

  // Función para remover otras reacciones en modo exclusivo
  async function removeOtherReactions(message, user, currentEmoji, member) {
    try {
      console.log(`🔄 Modo exclusivo activado para ${user.tag} - Removiendo otras reacciones...`);
      
      const reactions = message.reactions.cache;
      const roleConfig = reactionRoles.get(message.id);
      
      for (const [emoji, reaction] of reactions) {
        if (emoji !== currentEmoji && roleConfig.has(emoji)) {
          // Verificar si el usuario tiene esta reacción
          const userReacted = reaction.users.cache.has(user.id);
          if (userReacted) {
            console.log(`🔄 Removiendo reacción ${emoji} de ${user.tag}`);
            
            // Remover la reacción del usuario
            await reaction.users.remove(user.id);
            
            // Remover el rol asociado si lo tiene
            const roleId = roleConfig.get(emoji);
            const role = message.guild.roles.cache.get(roleId);
            if (role) {
              // Refrescar member data antes de verificar roles
              await member.fetch(true);
              const hasRole = member.roles.cache.has(roleId);
              console.log(`🔍 Usuario ${user.tag} tiene rol "${role.name}": ${hasRole ? 'SÍ' : 'NO'}`);
              
              if (hasRole) {
                await member.roles.remove(role);
                console.log(`🔄 Rol "${role.name}" removido de ${user.tag} (modo exclusivo)`);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error en removeOtherReactions:', error);
      console.error('Detalles del error:', error.message);
    }
  }

  // Evento cuando se quita una reacción
  client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    await fetchPartialData(reaction, reaction.message);

    const messageId = reaction.message.id;
    const emojiIdentifier = getEmojiIdentifier(reaction.emoji);

    console.log(`❌ Usuario ${user.tag} quitó reacción: ${emojiIdentifier}`);

    if (reactionRoles.has(messageId)) {
      const roleConfig = reactionRoles.get(messageId);
      if (roleConfig.has(emojiIdentifier)) {
        const roleId = roleConfig.get(emojiIdentifier);
        const role = reaction.message.guild.roles.cache.get(roleId);

        if (role) {
          try {
            // Refrescar la información del miembro para evitar problemas de cache
            const member = await reaction.message.guild.members.fetch({ user: user.id, force: true });
            
            // Verificar si realmente tiene el rol
            const hasRole = member.roles.cache.has(roleId);
            console.log(`🔍 Verificando rol "${role.name}" para ${user.tag}: ${hasRole ? 'SÍ lo tiene' : 'NO lo tiene'}`);
            
            if (hasRole) {
              await member.roles.remove(role);
              console.log(`✅ Rol "${role.name}" removido exitosamente de ${user.tag}`);
            } else {
              console.log(`ℹ️ El usuario ${user.tag} no tenía el rol "${role.name}" - No hay nada que remover`);
            }
          } catch (error) {
            console.error(`❌ Error al remover rol de ${user.tag}:`, error);
            console.error('Detalles del error:', error.message);
          }
        } else {
          console.log(`⚠️ No se encontró el rol con ID: ${roleId}`);
        }
      }
    }
  });

  console.log('✅ Sistema de Reaction Roles Multi-Reacción activo.');
};

function getEmojiIdentifier(emoji) {
  if (emoji.id) {
    const prefix = emoji.animated ? '<a:' : '<:';
    return `${prefix}${emoji.name}:${emoji.id}>`;
  } else {
    return emoji.name;
  }
}

async function fetchPartialData(reaction, message) {
  if (reaction.partial) {
    try { 
      await reaction.fetch(); 
    } catch (error) {
      console.error('Error al fetch de reacción parcial:', error);
    }
  }
  if (message.partial) {
    try { 
      await message.fetch(); 
    } catch (error) {
      console.error('Error al fetch de mensaje parcial:', error);
    }
  }
}