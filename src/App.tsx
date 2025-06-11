import { useState, useEffect, useRef } from "react";
import debounce from "lodash/debounce";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";

//Правила валидации
const AMINO_REGEX = /^[ARNDCEQGHILKMFPSTWYV-]+$/i;

//Цветовая схема аминокислот
const COLOR_MAP: Record<string, string> = {
  C: "#FFEA00",
  G: "#C4C4C4",
  D: "#FC9CAC",
  E: "#FC9CAC",
  K: "#BB99FF",
  R: "#BB99FF",
  S: "#80BFFF",
  T: "#80BFFF",
  H: "#80BFFF",
  Q: "#80BFFF",
  N: "#80BFFF",
  A: "#67E4A6",
  I: "#67E4A6",
  L: "#67E4A6",
  M: "#67E4A6",
  F: "#67E4A6",
  W: "#67E4A6",
  Y: "#67E4A6",
  V: "#67E4A6",
  P: "#67E4A6",
};

//Стили для отображения последовательностей
const charBlockStyle = {
  whiteSpace: "pre-wrap",
  fontFamily: "monospace",
  display: "block",
  wordBreak: "break-word",
};

const charStyle = {
  padding: "2px 4px",
  fontSize: 20,
};

//Тип для копмонента отображения последовательностей
type AlignmentProps = {
  seq1: string;
  seq2: string;
  onCopy: () => void;
  boxRef: React.RefObject<HTMLDivElement | null>;
};

//Компонент для отображения последовательностей
const AlignmentBlock = ({ seq1, seq2, onCopy, boxRef }: AlignmentProps) => {
  //Функционал для динамического деления строк на части при изменении размера экрана
  const [chunkSize, setChunkSize] = useState(20);
  useEffect(() => {
    if (!boxRef.current) return;

    const updateChunkSize = () => {
      const width = boxRef.current?.clientWidth || 0;
      const newChunkSize = Math.floor(width / 19);
      setChunkSize((prev) => (prev !== newChunkSize ? newChunkSize : prev));
    };

    const debouncedUpdate = debounce(updateChunkSize, 150);

    const observer = new ResizeObserver(debouncedUpdate);
    observer.observe(boxRef.current);

    updateChunkSize();

    return () => {
      observer.disconnect();
      debouncedUpdate.cancel();
    };
  }, [boxRef]);

  const chunks: Array<[string, string]> = [];
  for (let i = 0; i < seq1.length; i += chunkSize) {
    chunks.push([seq1.slice(i, i + chunkSize), seq2.slice(i, i + chunkSize)]);
  }

  //Функционал копирования
  const handleMouseUp = () => {
    const selection = window.getSelection()?.toString().replace(/\n/g, "");
    if (selection) {
      navigator.clipboard.writeText(selection);
      onCopy();
    }
  };

  return (
    <Box
      sx={{ pt: 3, display: "flex", flexDirection: "column", gap: "30px" }}
      onMouseUp={handleMouseUp}
      ref={boxRef}
    >
      {chunks.map(([s1, s2], idx) => (
        <Box
          key={idx}
          sx={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          <Box sx={{ ...charBlockStyle }}>
            {s1.split("").map((char, i) => (
              <span
                key={i}
                style={{
                  backgroundColor: COLOR_MAP[char] || "transparent",
                  ...charStyle,
                }}
              >
                {char}
              </span>
            ))}
          </Box>
          <Box sx={{ ...charBlockStyle }}>
            {s2.split("").map((char, i) => (
              <span
                key={i}
                style={{
                  backgroundColor: s2[i] !== s1[i] ? "#ffb6b6" : "transparent",
                  ...charStyle,
                }}
              >
                {char}
              </span>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

//Главный компонент отображения формы ввода
const App = () => {
  const boxRef = useRef(null);
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: { seq1: "", seq2: "" },
  });
  const [aligned, setAligned] = useState<{ seq1: string; seq2: string } | null>(
    null
  );
  const [copied, setCopied] = useState(false);

  const onSubmit = (data: { seq1: string; seq2: string }) => {
    setAligned({
      seq1: data.seq1.toUpperCase(),
      seq2: data.seq2.toUpperCase(),
    });
  };

  const seq1 = watch("seq1");
  const seq2 = watch("seq2");
  const sameLength = seq1.length === seq2.length;

  //Функционал для копирования в буфер
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Выравнивание аминокислот
      </Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="seq1"
          control={control}
          rules={{ required: true, pattern: AMINO_REGEX }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Последовательность 1"
              margin="normal"
              fullWidth
              error={!!errors.seq1}
              helperText={errors.seq1 ? "Неверный формат" : ""}
            />
          )}
        />
        <Controller
          name="seq2"
          control={control}
          rules={{ required: true, pattern: AMINO_REGEX }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Последовательность 2"
              margin="normal"
              fullWidth
              error={!!errors.seq2}
              helperText={errors.seq2 ? "Неверный формат" : ""}
            />
          )}
        />
        {!sameLength && (
          <Alert severity="warning">
            Последовательности должны быть одинаковой длины
          </Alert>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={!sameLength || !seq1 || !seq2}
          fullWidth
          sx={{ mt: 2 }}
        >
          Выравнять
        </Button>
      </form>

      {aligned && (
        <AlignmentBlock
          seq1={aligned.seq1}
          seq2={aligned.seq2}
          boxRef={boxRef}
          onCopy={() => setCopied(true)}
        />
      )}

      <Snackbar open={copied} autoHideDuration={1000}>
        <Alert severity="success">Скопировано в буфер обмена</Alert>
      </Snackbar>
    </Container>
  );
};

export default App;
