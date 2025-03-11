import {useOutletContext} from "react-router-dom";
import {AppContext} from "@/app/app.tsx";
import {useCallback, useState} from "react";
import {createAiTask} from "@/api/methods/flow.methods.ts";
import {AiTaskType, CreateAiTaskDTO} from "@/api/types/flow.types.ts";
import {toast} from "sonner";

function Blank () {

  const {handleBlankQuery} = useOutletContext<AppContext>();

  interface QueryForm {
    type: AiTaskType;
    prompt: string;
    promptParams: Record<string, string>;
  }

  const [queryForm, setQueryForm] = useState<QueryForm>({
    type: "general",
    prompt: "",
    promptParams: {}
  });

  const handleQuery = useCallback(() => {
    if (queryForm.prompt.trim() === "") {
      toast.error("请输入问题");
      return;
    }
    const createAiTaskDTO = {
      type: queryForm.type,
      prompt: queryForm.prompt,
      promptParams: null,
      convId: null,
      parentId: null
    } as CreateAiTaskDTO;
    createAiTask(createAiTaskDTO).then((response) => {
      toast.success("问题已发送");
      handleBlankQuery(response);
    });
  }, [handleBlankQuery, queryForm]);

  return (
    <div className="w-8/12 flex flex-col mt-16 mx-auto gap-4">
      <p className="text-2xl">请输入问题</p>
      <textarea
        className="border-black border-2 rounded-md p-2"
        value={queryForm.prompt}
        onChange={(e) => setQueryForm({...queryForm, prompt: e.target.value})}
      />
      <select
        className="border-2 border-black"
        value={queryForm.type}
        onChange={(event) => setQueryForm({...queryForm, type: event.target.value as AiTaskType})}>
        <option value="general">普通问答模式</option>
        <option value="knowledge">知识问答模式</option>
      </select>
      <button
        onClick={() => handleQuery()}
        className="border-black border-2 rounded-md bg-white text-black w-20 py-4"
      >
        发送
      </button>
    </div>
  );
}

export default Blank;