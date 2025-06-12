// Exemplos prontos de dicas em inglês para Secret Santa
const sampleClues = [
  "This person always has a bright smile, wears glasses, and loves reading mystery novels.",
  "With curly brown hair and a creative mind, this person is often found sketching in their notebook.",
  "Tall and friendly, they have a passion for soccer and never miss a game!",
  "You might spot their colorful scarf and hear their contagious laughter in the hallway.",
  "They have short black hair, are a bit shy, but sing beautifully in the school choir.",
  "With sparkling blue eyes and a love for cooking, this person often brings delicious snacks.",
  "Always making jokes, this person plays video games and has a great sense of humor.",
  "They are quiet, love painting, and often help classmates with their art projects.",
  "Known for their athletic skills, this person is outgoing and always up for a new challenge.",
  "With long blonde hair and a gentle personality, they enjoy playing guitar in their free time."
];

// Função para gerar uma dica aleatória do array acima
function generateClue() {
    const clueOutputDiv = document.getElementById('clueOutput');
    const generateButton = document.getElementById('generateClueButton');
    const loadingIndicator = document.getElementById('loadingIndicator');

    clueOutputDiv.textContent = ''; // Limpa dica anterior
    loadingIndicator.classList.remove('hidden'); // Mostra "gerando"
    generateButton.disabled = true;
    generateButton.classList.add('opacity-50', 'cursor-not-allowed');

    // Simula um pequeno delay para efeito de "gerando"
    setTimeout(() => {
        // Sorteia uma dica aleatória
        const randomIndex = Math.floor(Math.random() * sampleClues.length);
        clueOutputDiv.textContent = sampleClues[randomIndex];

        loadingIndicator.classList.add('hidden');
        generateButton.disabled = false;
        generateButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }, 800); // 800ms para dar um efeito de carregamento
}

// Event listener do botão
document.getElementById('generateClueButton').onclick = generateClue;