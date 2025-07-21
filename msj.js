// comandos.js - Comandos de texto sencillos para Discord bot

const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
    
    // Comando: -hola
    client.on('messageCreate', (message) => {
        if (message.content === '-hola') {
            if (message.author.bot) return;
            
            const embed = new EmbedBuilder()
                .setTitle('👋 ¡Hola!')
                .setDescription('¿Cómo estás?')
                .setColor('Purple')
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${message.author.username}`, iconURL: message.author.displayAvatarURL() });
            
            message.reply({ embeds: [embed] });
        }
    });

    // Comando: -saludo [usuario]
    client.on('messageCreate', (message) => {
        if (message.content.startsWith('-saludo')) {
            if (message.author.bot) return;
            
            const usuario = message.mentions.users.first();
            if (usuario) {
                const embed = new EmbedBuilder()
                    .setTitle('🎉 ¡Saludo!')
                    .setDescription(`¡Hola ${usuario}! ¿Qué tal?`)
                    .setColor('Purple')
                    .setTimestamp()
                    .setFooter({ text: `Solicitado por ${message.author.username}`, iconURL: message.author.displayAvatarURL() });
                
                message.channel.send({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error')
                    .setDescription('Debes mencionar a un usuario.\n\n**Ejemplo:** `-saludo @usuario`')
                    .setColor('Purple')
                    .setTimestamp();
                
                message.reply({ embeds: [embed] });
            }
        }
    });

    // Comando: -dado
    client.on('messageCreate', (message) => {
        if (message.content === '-dado') {
            if (message.author.bot) return;
            const numero = Math.floor(Math.random() * 6) + 1;
            
            const embed = new EmbedBuilder()
                .setTitle('🎲 Lanzamiento de Dado')
                .setDescription(`¡Salió el número **${numero}**!`)
                .setColor('Purple')
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${message.author.username}`, iconURL: message.author.displayAvatarURL() });
            
            message.reply({ embeds: [embed] });
        }
    });

    // Comando: -moneda
    client.on('messageCreate', (message) => {
        if (message.content === '-moneda') {
            if (message.author.bot) return;
            const resultado = Math.random() < 0.5 ? 'Cara' : 'Cruz';
            const emoji = resultado === 'Cara' ? '🪙' : '🔄';
            
            const embed = new EmbedBuilder()
                .setTitle(`${emoji} Lanzamiento de Moneda`)
                .setDescription(`¡Salió **${resultado}**!`)
                .setColor('Purple')
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${message.author.username}`, iconURL: message.author.displayAvatarURL() });
            
            message.reply({ embeds: [embed] });
        }
    });

    // Comando: -8ball [pregunta]
    client.on('messageCreate', (message) => {
        if (message.content.startsWith('-8ball')) {
            if (message.author.bot) return;
            
            const pregunta = message.content.slice(7).trim();
            if (!pregunta) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error')
                    .setDescription('Debes hacer una pregunta.\n\n**Ejemplo:** `-8ball ¿lloverá hoy?`')
                    .setColor('Purple')
                    .setTimestamp();
                
                message.reply({ embeds: [embed] });
                return;
            }

            const respuestas = [
                'Sí, definitivamente',
                'Sin duda',
                'Es muy probable',
                'Las perspectivas son buenas',
                'Puedes contar con ello',
                'Como yo lo veo, sí',
                'Probablemente',
                'Es incierto',
                'Pregunta de nuevo más tarde',
                'Mejor no decirte ahora',
                'No puedo predecirlo ahora',
                'Concéntrate y pregunta de nuevo',
                'No cuentes con ello',
                'Mi respuesta es no',
                'Mis fuentes dicen que no',
                'Las perspectivas no son tan buenas',
                'Muy dudoso'
            ];

            const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)];
            
            const embed = new EmbedBuilder()
                .setTitle('🎱 Bola 8 Mágica')
                .addFields(
                    { name: '❓ Pregunta', value: pregunta, inline: false },
                    { name: '🔮 Respuesta', value: respuesta, inline: false }
                )
                .setColor('Purple')
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${message.author.username}`, iconURL: message.author.displayAvatarURL() });
            
            message.reply({ embeds: [embed] });
        }
    });

    // Comando: -servidor
    client.on('messageCreate', (message) => {
        if (message.content === '-servidor') {
            if (message.author.bot) return;
            
            const servidor = message.guild;
            
            const embed = new EmbedBuilder()
                .setTitle('📊 Información del Servidor')
                .addFields(
                    { name: '🏷️ Nombre', value: servidor.name, inline: true },
                    { name: '👥 Miembros', value: servidor.memberCount.toString(), inline: true },
                    { name: '👑 Propietario', value: `<@${servidor.ownerId}>`, inline: true },
                    { name: '📅 Creado', value: servidor.createdAt.toLocaleDateString('es-ES'), inline: false }
                )
                .setColor('Purple')
                .setThumbnail(servidor.iconURL() || null)
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${message.author.username}`, iconURL: message.author.displayAvatarURL() });
            
            message.channel.send({ embeds: [embed] });
        }
    });

    // Comando: -avatar [usuario]
    client.on('messageCreate', (message) => {
        if (message.content.startsWith('-avatar')) {
            if (message.author.bot) return;
            
            const usuario = message.mentions.users.first() || message.author;
            const avatarURL = usuario.displayAvatarURL({ dynamic: true, size: 512 });
            
            const embed = new EmbedBuilder()
                .setTitle(`🖼️ Avatar de ${usuario.username}`)
                .setImage(avatarURL)
                .setColor('Purple')
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${message.author.username}`, iconURL: message.author.displayAvatarURL() });
            
            message.channel.send({ embeds: [embed] });
        }
    });

    // Comando: -ping
    client.on('messageCreate', (message) => {
        if (message.content === '-ping') {
            if (message.author.bot) return;
            
            const ping = client.ws.ping;
            
            const embed = new EmbedBuilder()
                .setTitle('🏓 Pong!')
                .setDescription(`**Latencia:** ${ping}ms`)
                .setColor('Purple')
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${message.author.username}`, iconURL: message.author.displayAvatarURL() });
            
            message.reply({ embeds: [embed] });
        }
    });

    // Comando: -fecha
    client.on('messageCreate', (message) => {
        if (message.content === '-fecha') {
            if (message.author.bot) return;
            
            const ahora = new Date();
            const fecha = ahora.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const hora = ahora.toLocaleTimeString('es-ES');
            
            const embed = new EmbedBuilder()
                .setTitle('🕐 Fecha y Hora Actual')
                .addFields(
                    { name: '📅 Fecha', value: fecha, inline: false },
                    { name: '🕐 Hora', value: hora, inline: false }
                )
                .setColor('Purple')
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${message.author.username}`, iconURL: message.author.displayAvatarURL() });
            
            message.reply({ embeds: [embed] });
        }
    });

    // Comando: -clima [ciudad]
    client.on('messageCreate', (message) => {
        if (message.content.startsWith('-clima')) {
            if (message.author.bot) return;
            
            const ciudad = message.content.slice(7).trim();
            if (!ciudad) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error')
                    .setDescription('Debes especificar una ciudad.\n\n**Ejemplo:** `-clima Madrid`')
                    .setColor('Purple')
                    .setTimestamp();
                
                message.reply({ embeds: [embed] });
                return;
            }
            
            // Simulación de clima (puedes conectar una API real más tarde)
            const climas = [
                { descripcion: '☀️ Soleado', color: 0xFFD700 },
                { descripcion: '🌤️ Parcialmente nublado', color: 0x87CEEB },
                { descripcion: '☁️ Nublado', color: 0x708090 },
                { descripcion: '🌧️ Lluvioso', color: 0x4682B4 },
                { descripcion: '⛈️ Tormentoso', color: 0x2F4F4F }
            ];
            const temperaturas = [15, 18, 22, 25, 28, 30, 32];
            
            const climaAleatorio = climas[Math.floor(Math.random() * climas.length)];
            const tempAleatoria = temperaturas[Math.floor(Math.random() * temperaturas.length)];
            
            const embed = new EmbedBuilder()
                .setTitle(`🌍 Clima en ${ciudad}`)
                .addFields(
                    { name: '🌤️ Estado', value: climaAleatorio.descripcion, inline: true },
                    { name: '🌡️ Temperatura', value: `${tempAleatoria}°C`, inline: true }
                )
                .setColor('Purple')
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${message.author.username} • Datos simulados`, iconURL: message.author.displayAvatarURL() });
            
            message.reply({ embeds: [embed] });
        }
    });

    // Comando: -contar [texto]
    client.on('messageCreate', (message) => {
        if (message.content.startsWith('-contar')) {
            if (message.author.bot) return;
            
            const texto = message.content.slice(8).trim();
            if (!texto) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Error')
                    .setDescription('Debes proporcionar un texto.\n\n**Ejemplo:** `-contar Hola mundo`')
                    .setColor('Purple')
                    .setTimestamp();
                
                message.reply({ embeds: [embed] });
                return;
            }
            
            const caracteres = texto.length;
            const palabras = texto.split(' ').filter(palabra => palabra.length > 0).length;
            
            const embed = new EmbedBuilder()
                .setTitle('📝 Estadísticas del Texto')
                .setDescription(`**Texto analizado:** "${texto}"`)
                .addFields(
                    { name: '🔤 Caracteres', value: caracteres.toString(), inline: true },
                    { name: '📄 Palabras', value: palabras.toString(), inline: true }
                )
                .setColor('Purple')
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${message.author.username}`, iconURL: message.author.displayAvatarURL() });
            
            message.reply({ embeds: [embed] });
        }
    });

    // Comando: -ayuda
    client.on('messageCreate', (message) => {
        if (message.content === '-ayuda') {
            if (message.author.bot) return;
            
            const embed = new EmbedBuilder()
                .setTitle('📋 Lista de Comandos')
                .setColor('Purple')
                .setDescription('Aquí tienes todos los comandos disponibles:\n\n👋 **Interacción**\n• `-hola` - Saludo simple\n• `-saludo @usuario` - Saluda a un usuario\n\n🎮 **Entretenimiento**\n• `-dado` - Lanza un dado (1-6)\n• `-moneda` - Lanza una moneda\n• `-8ball [pregunta]` - Bola 8 mágica\n\n📊 **Información**\n• `-servidor` - Info del servidor\n• `-avatar [@usuario]` - Muestra avatar\n• `-ping` - Muestra latencia\n• `-fecha` - Fecha y hora actual\n\n🛠️ **Utilidades**\n• `-clima [ciudad]` - Clima simulado\n• `-contar [texto]` - Cuenta caracteres y palabras\n• `-ayuda` - Muestra este mensaje\n\n⚙️ **Reaction Roles** *(Solo moderadores)*\n• `-setrole [messageID] [emoji] [roleID]` - Configura un reaction role individual\n• `-setmassive [messageID] [emoji:roleID] ...` - Configura múltiples reaction roles\n• `-listroles` - Lista todos los roles configurados\n• `-removerole [messageID] [emoji]` - Elimina un reaction role específico')
                .setTimestamp();

            message.channel.send({ embeds: [embed] });
        }
    });

    console.log('✅ Comandos de texto cargados correctamente');
};