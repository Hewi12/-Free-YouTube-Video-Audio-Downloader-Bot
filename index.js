import { Telegraf, Markup } from 'telegraf';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import express from 'express';
dotenv.config();

const app = express();
app.get('/', (req, res) => res.send('Bot is Running Online! 🚀'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const userRequests = new Map();

bot.start((ctx) => {
    ctx.reply('please send me the link. 🚀');
});

bot.on('text', async (ctx) => {
    const messageText = ctx.message.text;

    if (messageText.includes('youtube.com/') || messageText.includes('youtu.be/')) {
        const userId = ctx.from.id;
        userRequests.set(userId, messageText);

        await ctx.reply('in what format should i download 👇', 
            Markup.inlineKeyboard([
                [
                    Markup.button.callback('🎬 video (MP4)', 'download_video'),
                    Markup.button.callback('🎵 audio (Mp3)', 'download_audio')
                ]
            ])
        );
    } else {
        await ctx.reply('please send me only the correct youtube link');
    }
});

// 1. video download
bot.action('download_video', async (ctx) => {
    const userId = ctx.from.id;
    const url = userRequests.get(userId);

    if (!url) return ctx.reply('please send it me again');
    
    try {
        await ctx.answerCbQuery();
        await ctx.reply('🔄 Processing your video request...');
        await ctx.sendChatAction('upload_video');

        const outputTemplate = path.resolve(`video_${Date.now()}.mp4`);
        const command = `yt-dlp -f "b[ext=mp4]" -o "${outputTemplate}" "${url}"`;

        exec(command, async (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error}`);
                return ctx.reply('sorry i could not download the video');
            }

            if (fs.existsSync(outputTemplate)) {
                await ctx.sendVideo({ source: outputTemplate }, { caption: '🎬 Downloaded successfully!' });
                fs.unlinkSync(outputTemplate);
            } else {
                await ctx.reply('File generation failed.');
            }
        });

    } catch (error) {
        console.error(error);
        await ctx.reply('sorry i could not download the video');
    }
});

// 2. ኦዲዮ ማውረጃ
bot.action('download_audio', async (ctx) => {
    const userId = ctx.from.id;
    const url = userRequests.get(userId);

    if (!url) return ctx.reply('please send the link again');

    try {
        await ctx.answerCbQuery();
        await ctx.reply('🔄 Processing your audio request...');
        await ctx.sendChatAction('upload_voice');

        const outputTemplate = path.resolve(`audio_${Date.now()}.m4a`);
        const command = `yt-dlp -f "ba[ext=m4a]" -o "${outputTemplate}" "${url}"`;

        exec(command, async (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error}`);
                return ctx.reply('sorry i can not download audio');
            }

            if (fs.existsSync(outputTemplate)) {
                await ctx.sendAudio({ source: outputTemplate }, { title: 'Downloaded Audio' });
                fs.unlinkSync(outputTemplate);
            } else {
                await ctx.reply('Audio generation failed.');
            }
        });

    } catch (error) {
        console.error(error);
        await ctx.reply('sorry i can not download audio');
    }
});

bot.launch()
    .then(() => console.log('🚀 ቦቱ በአዲሱና ፍጹም አስተማማኙ መንገድ ስራ ጀምሯል!'))
    .catch((err) => console.error('Error:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));