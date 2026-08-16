/* ==========================================================
   EveryCourtAI
   Chat Manager
   Version 2.0
   Connected to Cloudflare Worker
========================================================== */

class ChatManager {

    constructor() {

        this.messages = [];

        this.chatWindow =
            document.getElementById("chatWindow");

        this.input =
            document.getElementById("chatInput");

        this.sendButton =
            document.getElementById("sendButton");

        this.initialize();

    }

    initialize() {

        if (this.sendButton) {

            this.sendButton.addEventListener(
                "click",
                () => this.sendMessage()
            );

        }

        if (this.input) {

            this.input.addEventListener(
                "keydown",
                (event) => {

                    if (
                        event.key === "Enter" &&
                        !event.shiftKey
                    ) {

                        event.preventDefault();

                        this.sendMessage();

                    }

                }
            );

        }

    }

    async sendMessage() {

        const text =
            this.input.value.trim();

        if (!text) return;

        this.addMessage(
            "user",
            text
        );

        this.input.value = "";

        this.showTyping();

        try {

            const language =
                window.currentLanguage || "en";

            const response =
                await EveryCourtAPI.ask({

                    prompt: text,

                    language: language,

                    conversation: this.messages

                });

            this.hideTyping();

            if (!response.success) {

                this.addMessage(

                    "assistant",

                    "Connection Error."

                );

                return;

            }

            this.addMessage(

                "assistant",

                response.answer

            );

            this.updateRecommendation(

                response.recommendation

            );

        }

        catch (error) {

            console.error(error);

            this.hideTyping();

            this.addMessage(

                "assistant",

                "Network Error."

            );

        }

    }

    addMessage(role, text) {

        this.messages.push({

            role,

            content: text

        });

        if (!this.chatWindow) return;

        const div =
            document.createElement("div");

        div.className =
            role === "user"
                ? "message user"
                : "message assistant";

        div.innerHTML = text;

        this.chatWindow.appendChild(div);

        this.chatWindow.scrollTop =
            this.chatWindow.scrollHeight;

    }

    showTyping() {

        if (!this.chatWindow) return;

        this.typing =
            document.createElement("div");

        this.typing.className =
            "message assistant typing";

        this.typing.innerHTML =
            "EveryCourtAI is analysing your setup...";

        this.chatWindow.appendChild(

            this.typing

        );

    }

    hideTyping() {

        if (
            this.typing &&
            this.typing.parentNode
        ) {

            this.typing.remove();

        }

    }

    updateRecommendation(rec) {

        if (!rec) return;

        const confidence =
            document.getElementById(
                "confidenceValue"
            );

        if (confidence) {

            confidence.innerHTML =
                rec.confidence + "%";

        }

        const racquet =
            document.getElementById(
                "recommendRacquet"
            );

        if (racquet) {

            racquet.innerHTML =
                rec.racquet;

        }

        const string =
            document.getElementById(
                "recommendString"
            );

        if (string) {

            string.innerHTML =
                rec.string;

        }

        const tension =
            document.getElementById(
                "recommendTension"
            );

        if (tension) {

            tension.innerHTML =
                rec.tension_lbs + " lbs";

        }

    }

}

window.chatManager =
    new ChatManager();
