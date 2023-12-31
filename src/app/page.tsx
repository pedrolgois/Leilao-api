"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Leilao, formatMoney, formatarDataParaExibicao } from "../lib/data";
import { ToastContainer, toast } from "react-toastify";

// Styles
import styles from "./page.module.css";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true);
  const [selectedLeilao, setSelectedLeilao] = useState(null);
  const [user, setUser] = useState({ name: "", cpf: "" });

  const [leiloes, setLeiloes] = useState<Leilao[]>([]);

  async function getLeiloes() {
    const response = await fetch("/api/leiloes");
    const data = await response.json();
    setLeiloes(data.leiloes);
  }

  useEffect(() => {
    getLeiloes();
    if (localStorage.getItem("user")) {
      setUser(JSON.parse(localStorage.getItem("user") as string));
    }
  }, []);

  return (
    <>
      <div className={styles.leilao}>
        <div>
          <header>
            <h1>Leilão</h1>
            <h2>
              Bem vindo <span>{user.name}</span>
            </h2>
            <button
              onClick={() => {
                window.location.reload();
              }}
            >
              Sair
            </button>
          </header>
          <main>
            <div>
              <ItemForm refresh={getLeiloes} />
            </div>
            <div>
              <ItemList leiloes={leiloes} setLeilao={setSelectedLeilao} />
            </div>
          </main>
        </div>
      </div>
      <LoginModal
        modalOpen={isLoginModalOpen}
        setModalOpen={setIsLoginModalOpen}
        setUserMain={setUser}
      />
      <LeilaoModal
        refresh={getLeiloes}
        selectedLeilao={selectedLeilao}
        setSelectedLeilao={setSelectedLeilao}
      />
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

function LeilaoModal({
  selectedLeilao,
  setSelectedLeilao,
  refresh,
}: {
  selectedLeilao: Leilao | null;
  setSelectedLeilao: Function;
  refresh: Function;
}) {
  const [lance, setLance] = useState("0");
  const [user, setUser] = useState({ name: "", cpf: "" });

  useEffect(() => {
    if (localStorage.getItem("user")) {
      setUser(JSON.parse(localStorage.getItem("user") as string));
    }
  }, []);
  const maiorLance = selectedLeilao?.lances.reduce(
    (prev, current) => {
      return prev.value > current.value ? prev : current;
    },
    { value: 0, participant: { name: "" } }
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const participant = user;
    const novolance = {
      value: lance,
      participant,
    };
    await fetch(`/api/leiloes/${selectedLeilao?.id}/lances`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(novolance),
    }).then(async (res) => {
      const data = await res.json();
      if (res.status == 200) {
        toast.success("Lance cadastrado com sucesso");
        setSelectedLeilao(data.leilao);
        refresh();
      } else {
        toast.error(data.message);
      }
    });
  }

  const orderedLances = selectedLeilao?.lances.sort((a, b) => {
    return a.value > b.value ? -1 : 1;
  });

  const vencido =
    selectedLeilao &&
    Date.now() > new Date(selectedLeilao.horarioLimite).getTime();
  return (
    <div
      className={[styles.leilaoModal, !selectedLeilao && styles.closed].join(
        " "
      )}
    >
      <div>
        <button
          className={styles.close}
          onClick={() => setSelectedLeilao(null)}
        >
          x
        </button>
        <h2>Leilão</h2>
        <div className={styles.info}>
          <img src={"https://cdn-icons-png.flaticon.com/512/234/234707.png"} />
          <div>
            <h3>{selectedLeilao?.item.name || ""}</h3>
            <p>{selectedLeilao?.item.description || ""}</p>
            <small>
              Limite:{" "}
              {formatarDataParaExibicao(
                new Date(selectedLeilao?.horarioLimite || "")
              )}
            </small>
            <br />
            <small>
              Status:{" "}
              {vencido || selectedLeilao?.item.status == "Vendido"
                ? "Vendido"
                : "A venda"}
            </small>
          </div>
        </div>
        <h2>Lances</h2>

        <div className={styles.lances}>
          {selectedLeilao?.item.status === "A venda" && !vencido && (
            <form onSubmit={handleSubmit}>
              <div>
                <input
                  type="number"
                  onChange={(e) => setLance(e.target.value)}
                />
                <button type="submit">Dar Lance</button>
              </div>
              <small>
                Lance Mínimo: R$
                {formatMoney(selectedLeilao?.item.minimumValue || 0)}
              </small>
              <small>
                Maior lance: R$ {formatMoney(maiorLance?.value || 0)} (
                {maiorLance?.participant.name})
              </small>
            </form>
          )}

          <div className={styles.lista}>
            {orderedLances?.map((lance, index) => (
              <div
                key={lance.id}
                className={[
                  styles.lance,
                  index == 0 && styles.possibleWinner,
                  (index == 0 && vencido) ||
                    (selectedLeilao?.item.status == "Vendido" && styles.winner),
                  user.cpf == lance.participant.cpf && styles.userLance,
                ].join(" ")}
              >
                <div>
                  <h3>{lance.participant.name}</h3>
                </div>
                <p>R$ {formatMoney(lance.value)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Lista de itens cadastrados

function ItemList({
  leiloes,
  setLeilao,
}: {
  leiloes: Leilao[];
  setLeilao: Function;
}) {
  return (
    <div>
      <h2>Itens</h2>
      {leiloes.map((leilao) => {
        const vencido = Date.now() > new Date(leilao.horarioLimite).getTime();

        return (
          <div
            key={leilao.id}
            onClick={() => setLeilao(leilao)}
            className={styles.item}
          >
            <img
              src={"https://cdn-icons-png.flaticon.com/512/234/234707.png"}
              alt={leilao.item.name}
            />
            <div>
              <h3>{leilao.item.name}</h3>
              <p>{leilao.item.description}</p>
              <small>
                Limite:{" "}
                {formatarDataParaExibicao(new Date(leilao.horarioLimite))}
              </small>
              <br />
              <small>Status: {vencido ? "Vendido" : leilao.item.status}</small>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Formulário de cadastro de item

function ItemForm({ refresh }: { refresh: Function }) {
  const defaultItem = {
    name: "",
    description: "",
    minimumValue: 0,
    horarioLimite: "",
  };
  const [item, setItem] = useState(defaultItem);

  const handleItem = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setItem({ ...item, [name]: value });
  };

  const handleSubmitItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await fetch("/api/itens", {
        method: "POST",
        body: JSON.stringify(item),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then(async (res) => {
          const data = await res.json();
          if (res.status != 200) {
            throw new Error(data.message);
          }
          const newItem = data.item;
          const horarioLimite = new Date(item.horarioLimite);
          const leilaoBody = {
            itemId: newItem.id,
            horarioLimite,
          };
          await fetch("api/leiloes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(leilaoBody),
          }).then(async (res) => {
            const data = await res.json();
            if (res.status == 200) {
              toast.success("Item cadastrado com sucesso");
            } else {
              toast.error(data.message);
            }
          });
          refresh();
          setItem(defaultItem);
        })
        .catch((err) => toast.error(err.message));
    } catch (err) {
      toast.error("Erro ao cadastrar item");
    }
  };

  return (
    <form onSubmit={handleSubmitItem} className={styles.form}>
      <h2>Cadastrar Item</h2>
      <div>
        <label htmlFor="name">Nome</label>
        <input
          type="text"
          name="name"
          value={item.name}
          required
          onChange={handleItem}
        />
      </div>
      <div>
        <label htmlFor="description">Descrição</label>
        <input
          type="text"
          name="description"
          value={item.description}
          required
          onChange={handleItem}
        />
      </div>
      <div>
        <label htmlFor="minimumValue">Valor mínimo R$</label>
        <input
          type="number"
          name="minimumValue"
          value={item.minimumValue}
          required
          onChange={handleItem}
        />
      </div>
      <div>
        <label htmlFor="horarioLimite">Data limite para leilão</label>
        <input
          type="datetime-local"
          name="horarioLimite"
          onChange={handleItem}
          value={item.horarioLimite}
          required
        />
      </div>
      <button type="submit">Salvar</button>
    </form>
  );
}

// Modal de Login para o leilão

function LoginModal({
  modalOpen,
  setModalOpen,
  setUserMain,
}: {
  modalOpen: boolean;
  setModalOpen: Function;
  setUserMain: Function;
}) {
  const defaultUser = {
    name: "",
    cpf: "",
  };
  const [user, setUser] = useState(defaultUser);

  function handleUser(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    localStorage.setItem("user", JSON.stringify(user));
    setModalOpen(false);
    setUserMain(user);
    setUser(defaultUser);
  }
  return (
    <div className={[styles.loginModal, !modalOpen && styles.closed].join(" ")}>
      <div>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Nome completo"
            value={user.name}
            onChange={handleUser}
            required
          />
          <input
            type="text"
            name="cpf"
            placeholder="CPF"
            value={user.cpf}
            onChange={handleUser}
            required
          />
          <button type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
}
