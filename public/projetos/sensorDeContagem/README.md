# "Sensor de Contagem"

## Funcionalidade:
Coletar informação da ocupação de passageiros de ônibus em tempo real. O projeto utiliza-se de dois sensores ultrassônicos distântes horizontalmente para efetuar a coleta de dados de entrada e de saída.
De forma que unindo entrada e saída teríamos uma estimativa da ocupação do coletivo.

## Dados a serem coletados:
- Quantidade de pessoas no coletivo (ocupação)

Até o momento não foi feita uma solução que permita a visualização de um histórico da ocupação em um período de tempo. Sendo apenas possível a checagem atual da quantidade de pessoas (qtd de entradas - qtd de saídas)

## Melhorias a se fazer:
Solução melhor para recuperação dos dados coletados:
- GSM (em tempo real por plataforma).
- Botão de ativação do bluetooth de um ESP32 para pareamento com um celular de consulta.
  - Os dados poderiam ser visualizados por um site/aplicativo que se conecte com o "Sensor de Contagem".
 Seria mais barato e econômico do que o GSM, em contrapartida não permitiria a consulta em tempo real por plataforma.
 
Solução de energia:uso de baterias de 3.7V que possuímos no LAB.

Melhoria na acurácia da coleta do dado:
- Utilizar uma câmera aliada a um microprocessador que realize a contagem de pessoas que passa pela escada do ônibus e contabilize a entrada ou saída.
  - Será uma solução bem desafiadora, pois precisamos lidar com as limitações de processamento do ESP32.
  - Talvez seja necessária conexão com internet para processar as imagens em um servidor (pode aumentar o custo do projeto)

## Dossiê:
[link dossiê](https://docs.google.com/document/d/1dxphPkdzJk9qOi8pO9xmXqBn42ALKvaYohdj8Rl080Y/edit?usp=sharing)
