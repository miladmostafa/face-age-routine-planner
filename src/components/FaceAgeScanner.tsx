import { useEffect, useRef, useState } from "react";
import type FaceAgeType from "face-age";
import { FALLBACK_ROUTINE_GROUPS, ROUTINE_SUPPORT, SAMPLE_PRODUCTS, SKIN_PROBLEMS } from "../lib/sampleCatalog";
import type { RoutineGroupInfo } from "../lib/types";

export type RoutineCapture = {
  products: unknown;
  groups: RoutineGroupInfo[];
};

type FaceAgeScannerProps = {
  clientId: string;
  useSampleCatalog: boolean;
  onCapture: (capture: RoutineCapture) => void;
  onGroups: (groups: RoutineGroupInfo[]) => void;
};

function asGroups(value: RoutineGroupInfo[] | null | undefined): RoutineGroupInfo[] {
  return Array.isArray(value) && value.length > 0 ? value : FALLBACK_ROUTINE_GROUPS;
}

export function FaceAgeScanner({ clientId, useSampleCatalog, onCapture, onGroups }: FaceAgeScannerProps) {
  const [status, setStatus] = useState("Preparing the scanner…");
  const [error, setError] = useState<string | null>(null);
  const onCaptureRef = useRef(onCapture);
  const onGroupsRef = useRef(onGroups);
  const sampleRef = useRef(useSampleCatalog);
  onCaptureRef.current = onCapture;
  onGroupsRef.current = onGroups;
  sampleRef.current = useSampleCatalog;

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    const host = document.getElementById("FaceAge-module");
    if (!host) {
      setError("The scanner container is missing from the page.");
      return;
    }

    const start = async () => {
      try {
        const module = await import("face-age");
        if (cancelled) return;
        const FaceAge = module.default;
        const faceAge: FaceAgeType = new FaceAge({
          elementId: "FaceAge-module",
          faceageId: clientId,
          displayModel: "section",
          language: "en",
          height: "680px",
          quiz: false,
          history: false,
          showProducts: true,
          showRoutine: true,
          showAddToCard: false,
          showAddToCardAll: false,
          routinesSupport: ROUTINE_SUPPORT,
          showEmptyRoutines: false,
          problems: [...SKIN_PROBLEMS],
          showCamera: true,
          showUpload: true,
        });

        const publishGroups = () => {
          const groups = asGroups(faceAge.API.getRoutineGroup());
          onGroupsRef.current(groups);
          return groups;
        };

        const applySampleCatalog = () => {
          if (!sampleRef.current) return;
          faceAge.API.setCustomProducts(SAMPLE_PRODUCTS);
        };

        publishGroups();
        void faceAge.onDisplayRoutines((data) => {
          onCaptureRef.current({ products: data, groups: publishGroups() });
          setStatus("Routine captured from Face Age. You can save it as your plan.");
        });
        void faceAge.onDisplayProducts((data) => {
          const list = Array.isArray(data) ? data : [];
          if (sampleRef.current && list.length === 0) {
            applySampleCatalog();
          }
        });
        void faceAge.onResetData(() => {
          onCaptureRef.current({ products: [], groups: publishGroups() });
          applySampleCatalog();
          setStatus("Scanner reset. Run another scan to capture a new routine.");
        });

        // render() does not settle its promise; do not await it.
        void faceAge.render();
        applySampleCatalog();
        setStatus("Scanner ready. Take or upload a photo, then open the routine tab.");

        let catalogAppliedAfterScan = false;
        timer = window.setInterval(() => {
          if (catalogAppliedAfterScan || !sampleRef.current) return;
          const image = faceAge.API.getImage();
          if (!image) return;
          catalogAppliedAfterScan = true;
          applySampleCatalog();
          setStatus("Photo received. Open the routine tab, then save the plan. Photos stay in the Face Age cloud.");
        }, 400);
      } catch (caught) {
        if (cancelled) return;
        const message = caught instanceof Error ? caught.message : "The Face Age scanner could not start.";
        setError(message);
      }
    };

    void start();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [clientId]);

  return (
    <section className="panel scanner-panel" aria-labelledby="scanner-heading">
      <div className="panel-head">
        <p className="eyebrow">Face Age scan</p>
        <h2 id="scanner-heading">Capture a morning and evening routine</h2>
        <p className="lede">
          The scanner below is the Face Age widget. After a scan, open the routine tab. This page listens for{" "}
          <code>onDisplayRoutines</code> and reads <code>API.getRoutineGroup()</code>.
        </p>
      </div>
      <p className="status-line" role="status">
        {error ?? status}
      </p>
      {error ? <p className="form-error">{error}</p> : null}
      <div id="FaceAge-module" className="scanner-host" />
      <p className="fine-print">
        Photos are analyzed in the Face Age cloud. This planner does not save images.{" "}
        <a href="https://getfaceage.com/" target="_blank" rel="noreferrer">
          getfaceage.com
        </a>
      </p>
    </section>
  );
}
