import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/firebase";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  Button,
  Input,
  Card,
  Typography,
  List,
  Space,
  message,
  Progress
} from "antd";

const { Title, Text } = Typography;

interface Question {
  question: string;
  options: string[];
  answer: string;
  image?: string; // Tambahkan properti image
}

interface LeaderboardEntry {
  name: string;
  score: number;
}

export default function QuizApp() {
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [name, setName] = useState<string>("");
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [canAnswer, setCanAnswer] = useState<boolean>(false);
//   const [showLeaderboard, setShowLeaderboard] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  const ADMIN_NAME = "sukma-rangga-admin-dayalima";

  const questions: Question[] = [
    {
      question: "Kamu sedang dalam perjalanan melintasi hutan sendirian. <br>Suatu pagi, kamu mendapati bahwa kamu hampir kehabisan air. <br> Kamu bisa mendapat tambahan air dari salah satu dari 4 sumber air: <br>Sumber air mana yang akan kamu pilih untuk mengisi botol minum penyaring airmu?",
      options: ["Kaktus berair", "Sebuah kolam air laut asin", "Sebuah danau yang tenang dan bening", "Anak sungai yang ada endapannya"],
      answer: "Anak sungai yang ada endapannya",
      image: "/images/masalah-di-hutan.png", // URL gambar
    },
    {
      question: "Berapa hasil 5 x 6?",
      options: ["30", "35", "20", "25"],
      answer: "30",
      image: "/images/masalah-di-hutan.png", // URL gambar
    },
  ];

  useEffect(() => {
    const savedName = localStorage.getItem("quizName");
    if (savedName) {
      setName(savedName);
      const isAdmin = savedName === ADMIN_NAME;
      setIsAdmin(isAdmin);
      setHasJoined(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "leaderboard"), (snapshot) => {
      const entries: LeaderboardEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as LeaderboardEntry;
        if (data.name !== ADMIN_NAME) entries.push(data);
      });
      setLeaderboard(entries);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "quizState", "status"), (docSnap) => {
      const data = docSnap.data();
      if (data) {
        setQuestionIndex(data.currentQuestionIndex);
        setCanAnswer(data.quizStarted);
        if (data.quizStarted && !isAdmin) {
          setTimeLeft(30);
          setTimerActive(true);
        } else {
          setTimerActive(false);
        }
      } else {
        setDoc(doc(db, "quizState", "status"), {
          quizStarted: false,
          currentQuestionIndex: 0,
        });
      }
    });
    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (!timerActive) return;
    if (timeLeft <= 0) {
       
      setCanAnswer(false);
      setTimerActive(false);
      setHasAnswered(true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, timerActive]);

  const joinRoom = async () => {
    if (!name.trim()) return;
    localStorage.setItem("quizName", name);
    const isAdmin = name === ADMIN_NAME;
    setIsAdmin(isAdmin);
    setHasJoined(true);

    if (!isAdmin) {
      await setDoc(doc(db, "leaderboard", name), {
        name,
        score: 0,
      });
    }

    const docSnap = await getDoc(doc(db, "quizState", "status"));
    const data = docSnap.data();
    if (data && data.quizStarted && !isAdmin) {
      setQuestionIndex(data.currentQuestionIndex);
      setCanAnswer(true);
      setTimeLeft(30);
      setTimerActive(true);
    }
  };

  const logout = async () => {
    localStorage.removeItem("quizName");
    setHasJoined(false);
    setName("");
    setIsAdmin(false);
    setSelectedOption(null);
    setScore(0);
    setCanAnswer(false);
    setTimerActive(false);
    if (name && name !== ADMIN_NAME) {
      await deleteDoc(doc(db, "leaderboard", name));
    }
  };


  const handleAnswer = async () => {
    if (!canAnswer || !selectedOption || isAdmin) return;
  
    setHasAnswered(true);
  
    if (selectedOption === questions[questionIndex].answer) {
      const newScore = score + 10;
      setScore(newScore);
      await updateDoc(doc(db, "leaderboard", name), {
        score: newScore,
      });
      message.success("Jawaban benar!");
    } else {
      message.error("Jawaban salah!");
    }
  
    setCanAnswer(false);
  };

  const startQuiz = async () => {
    if (isAdmin) {
      await setDoc(doc(db, "quizState", "status"), {
        quizStarted: true,
        currentQuestionIndex: 0,
      });
    }
  };

  const nextQuestion = async () => {
    if (isAdmin && questionIndex + 1 < questions.length) {
      await updateDoc(doc(db, "quizState", "status"), {
        currentQuestionIndex: questionIndex + 1,
        quizStarted: true,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      joinRoom();
    }
  };

  if (!hasJoined) {
    return (
      <Card style={{ maxWidth: 480, margin: "2rem auto" }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Title level={4}>Masukkan Nama untuk Masuk ke Room</Title>
          <Input
            placeholder="Nama"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyPress} // Tangani event Enter
          />
          <Button type="primary" onClick={joinRoom} block>
            Masuk
          </Button>
        </Space>
      </Card>
    );
  }

  return (
    <Card style={{ maxWidth: 1024, margin: "2rem auto" }}>
      {/* <Title level={3}>Peserta Masuk</Title>
      <List
        bordered
        dataSource={leaderboard}
        renderItem={(entry) => (
          <List.Item>
            <Text>{entry.name}</Text>
          </List.Item>
        )}
      /> */}
{
    !isAdmin &&   <>
    <Text strong>Nama Anda: {name}</Text>
    <Button danger style={{ marginTop: 8 }} onClick={logout}>
      Keluar
    </Button>
    </>    
}


      {isAdmin && (
        <Space direction="vertical" style={{ marginTop: 20, width: "100%" }}>
          <Button type="primary" block onClick={startQuiz}>
            Mulai Kuis
          </Button>
          <Button type="dashed" block onClick={nextQuestion}>
            Soal Selanjutnya
          </Button>
        </Space>
      )}

{questions[questionIndex] && (
  <div style={{ marginTop: 24 }}>
    <Title level={4}>{questions[questionIndex].question}</Title>
    {questions[questionIndex].image && (
      <img
        src={questions[questionIndex].image}
        alt="gambar soal"
        style={{ maxWidth: "100%", marginBottom: "1rem" }}
      />
    )}
    <Progress
      percent={(timeLeft / 30) * 100}
      format={() => `${timeLeft}s`}
      showInfo
    />
    {!isAdmin && (
      <Space direction="vertical" style={{ width: "100%" }}>
 {questions[questionIndex].options.map((opt, idx) => {
  const isCorrect = opt === questions[questionIndex].answer;
  const isSelected = selectedOption === opt;

  let type: "default" | "primary" | "dashed" | "link" | "text" | "ghost" = "default";
  let danger = false;

  if (hasAnswered) {
    if (isCorrect) {
      type = "primary"; // jawaban benar ditandai biru
    } else if (isSelected && !isCorrect) {
      danger = true; // jawaban salah yg dipilih user ditandai merah
    }
  } else if (isSelected) {
    type = "primary";
  }

  return (
    <Button
      key={idx}
      block
      type={type}
      danger={danger}
      disabled={!canAnswer}
      onClick={() => setSelectedOption(opt)}
    >
      {opt}
    </Button>
  );
})}
        <Button
          type="primary"
          block
          disabled={!selectedOption || !canAnswer}
          onClick={handleAnswer}
        >
          Jawab
        </Button>
      </Space>
    )}
  </div>
)}

      {/* {showLeaderboard && ( */}
        <div style={{ marginTop: 32 }}>
          <Title level={4}>Leaderboard</Title>
          <List
            bordered
            dataSource={leaderboard.sort((a, b) => b.score - a.score)}
            renderItem={(entry, idx) => (
              <List.Item>
                <Text>{idx + 1}. {entry.name}</Text>
                <Text strong>{entry.score}</Text>
              </List.Item>
            )}
          />
        </div>
      {/* )} */}
    </Card>
  );
}
