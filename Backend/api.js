import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { Redis } from 'ioredis'
import cors from 'cors';

const prisma = new PrismaClient({ datasources: {  db: { url: "mysql://root:jean123@localhost:3306/avaliacaoFilmes?schema=public" } } });

const app = express();
app.use(express.json());
app.use(cors())

const cliente = createClient();
const redis = new Redis();

//Métodos para manipulação de filmes
app.get('/filme', async (req, res) => {
  const filmesNaCache = await cliente.get('encontrarTodosFilmes');
  if(filmesNaCache){
    res.status(200).json(JSON.parse(filmesNaCache));
    //res.status(200).send("Redis");
    return;
  } else {
    await prisma.filme.findMany().then((filmes) => {
      cliente.set('encontrarTodosFilmes', JSON.stringify(filmes), {EX: 30});
      res.status(200).json(filmes);
      //res.status(200).send("MySql");
    }).catch((error) => {
      console.log(error);
      res.status(500).send('Erro ao buscar filmes!');
    });
  }
});

app.get('/filme/:id', async (req, res) => {
  await prisma.filme.findFirstOrThrow({
    where: {
      id: parseInt(req.params.id)
    }
  }).then((filme) => {
    res.status(200).json(filme);
  }).catch((error) => {
    console.log(error);
    res.status(404).send('Filme não encontrado');
  });
});

app.post('/filme', async (req, res) => {
  await prisma.filme.create({
    data: {
      titulo: req.body.titulo,
      diretor: req.body.diretor,
      dataLancamento: new Date(req.body.dataLancamento),
      genero: req.body.genero,
      sinopse: req.body.sinopse,
      caminhoImagem: req.body.caminhoImagem
    }
  }).then(() => {
    res.status(201).send('Filme adicionado com sucesso');
  }).catch((error) => {
    console.log(error);
    res.status(400).send('Erro ao adicionar filme');
  });
});

app.put('/filme/:id', async (req, res) => {
  await prisma.filme.update({
    where: {
      id: parseInt(req.params.id)
    },
    data: {
      titulo: req.body.titulo,
      diretor: req.body.diretor,
      dataLancamento: new Date(req.body.dataLancamento),
      genero: req.body.genero,
      sinopse: req.body.sinopse,
      caminhoImagem: req.body.caminhoImagem
    }
  }).then(() => {
    res.status(200).send('Filme atualizado com sucesso!');
  }).catch((error) => {
    console.log(error);
    res.status(400).send('Erro ao atualizar um filme!');
  });
});

app.delete('/filme/:id', async (req, res) => {
  await prisma.filme.delete({
    where: {
      id: parseInt(req.params.id)
    }
  }).then(() => {
    res.status(200).send('Filme deletado com sucesso!');
  }).catch((error) => {
    console.log(error);
    res.status(404).send('Filme não encontrado!');
  })
});

//Métodos para manipulação de avaliações
app.get('/avaliacao', async (req, res) => {
  const avaliacoesNaCache = await cliente.get('encontrarTodasAvaliacoes');
  if(avaliacoesNaCache){
    res.status(200).json(JSON.parse(avaliacoesNaCache));
    //res.status(200).send("Redis");
    return;
  } else {
    await prisma.avaliacao.findMany().then((avaliacaos) => {
      //redis.send_command('JSON.SET', 'avaliacoes', '.', JSON.stringify(avaliacaos));
      cliente.set('encontrarTodasAvaliacoes', JSON.stringify(avaliacaos), {EX: 30});
      res.status(200).json(avaliacaos);
      //res.status(200).send("MySql");
    }).catch((error) => {
      console.log(error);
      res.status(500).send('Erro ao buscar as avaliações!');
    });
  }
});

app.get('/avaliacao/:id', async (req, res) => {
  await prisma.avaliacao.findFirstOrThrow({
    where: {
      id: parseInt(req.params.id)
    }
  }).then((avaliacao) => {
    res.status(200).json(avaliacao);
  }).catch((error) => {
    console.log(error);
    res.status(404).send('Avaliação não encontrada!');
  });
});

app.post('/avaliacao', async (req, res) => {
  await prisma.avaliacao.create({
    data: {
      nomeUsuario: req.body.nomeUsuario,
      dataCriacao: new Date(req.body.dataCriacao),
      nota: parseFloat(req.body.nota),
      comentario: req.body.comentario,
      filmeId: parseInt(req.body.filmeId)
    }
  }).then(() => {
    res.status(201).send('Avaliação adicionada com sucesso!');
  }).catch((error) => {
    console.log(error);
    res.status(400).send('Erro ao adicionar a avaliação!');
  });
});

app.put('/avaliacao/:id', async (req, res) => {
  await prisma.avaliacao.update({
    where: {
      id: parseInt(req.params.id)
    },
    data: {
      nomeUsuario: req.body.nomeUsuario,
      dataCriacao: new Date(req.body.dataCriacao),
      nota: parseFloat(req.body.nota),
      comentario: req.body.comentario,
      filmeId: parseInt(req.body.filmeId)
    }
  }).then(() => {
    res.status(200).send('Avaliação atualizada com sucesso!');
  }).catch((error) => {
    console.log(error);
    res.status(400).send('Erro ao atualizar um filme!');
  });
});

app.delete('/avaliacao/:id', async (req, res) => {
  await prisma.avaliacao.delete({
    where: {
      id: parseInt(req.params.id)
    }
  }).then(() => {
    res.status(200).send('Avaliação deletada com sucesso!');
  }).catch((error) => {
    console.log(error);
    res.status(404).send('Avaliação não encontrada!');
  })
});

const startup = async () => {
  await cliente.connect();
  app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
  });
};

await startup();
