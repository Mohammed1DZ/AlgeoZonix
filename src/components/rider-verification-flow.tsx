'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Check, ArrowLeft, Bike, Car, User, Mail, KeyRound, Phone as PhoneIcon, FileText, BadgeCheck, ShieldCheck, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { kycDecision } from '@/ai/flows/kyc-decision-flow';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

type Step = {
  id: number;
  title: string;
  fields?: string[];
  captureType?: 'licenseFront' | 'licenseBack' | 'registrationFront' | 'registrationBack' | 'vehiclePhoto' | 'facePhoto';
  Icon: React.ElementType;
};

const steps: Step[] = [
  { id: 1, title: 'Select Vehicle Type', Icon: Car },
  { id: 2, title: 'Driver\'s License (Front)', captureType: 'licenseFront', Icon: FileText },
  { id: 3, title: 'Driver\'s License (Back)', captureType: 'licenseBack', Icon: FileText },
  { id: 4, title: 'Vehicle Registration (Front)', captureType: 'registrationFront', Icon: FileText },
  { id: 5, title: 'Vehicle Registration (Back)', captureType: 'registrationBack', Icon: FileText },
  { id: 6, title: 'Vehicle Photo', captureType: 'vehiclePhoto', Icon: Car },
  { id: 7, title: 'Facial Verification', captureType: 'facePhoto', Icon: ShieldCheck },
];

export function RiderVerificationFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const [formData, setFormData] = useState({
    licenseFront: '',
    licenseBack: '',
    registrationFront: '',
    registrationBack: '',
    vehiclePhoto: '',
    facePhoto: '',
    vehicleType: '',
  });
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const [showSample, setShowSample] = useState(false);

  const totalSteps = steps.length;
  const progress = (currentStep / totalSteps) * 100;
  const activeStep = steps.find(s => s.id === currentStep);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }

  const getCameraPermission = async () => {
    if (!activeStep?.captureType) return;
    const facingMode = activeStep?.captureType === 'facePhoto' ? 'user' : 'environment';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
      setHasCameraPermission(true);
      if (videoRef.current) {
        if (videoRef.current.srcObject) {
          (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to continue.',
      });
    }
  };

  useEffect(() => {
    if (activeStep?.captureType) {
      setShowSample(true);
      getCameraPermission();
      const timer = setTimeout(() => setShowSample(false), 2500); // Show sample for 2.5s
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep?.captureType]);


  const handleCapture = (captureType: NonNullable<Step['captureType']>) => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;
    
    const isPortraitStep = ['registrationFront', 'registrationBack', 'facePhoto'].includes(captureType);
    const targetAspectRatio = isPortraitStep ? 3 / 4 : 16 / 9;

    let sourceX = 0, sourceY = 0, sourceWidth = video.videoWidth, sourceHeight = video.videoHeight;
    const videoAspectRatio = video.videoWidth / video.videoHeight;

    if (videoAspectRatio > targetAspectRatio) {
        // Video is wider than target, crop horizontally
        sourceWidth = video.videoHeight * targetAspectRatio;
        sourceX = (video.videoWidth - sourceWidth) / 2;
    } else {
        // Video is taller than target, crop vertically
        sourceHeight = video.videoWidth / targetAspectRatio;
        sourceY = (video.videoHeight - sourceHeight) / 2;
    }

    // Set canvas to desired output size
    if (isPortraitStep) {
        canvas.width = 600;
        canvas.height = 800;
    } else {
        canvas.width = 1280;
        canvas.height = 720;
    }
    
    // For selfies, flip the canvas context horizontally
    if (captureType === 'facePhoto') {
        context.save();
        context.scale(-1, 1);
        context.translate(-canvas.width, 0);
    }
    
    context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);

    if (captureType === 'facePhoto') {
        context.restore();
    }
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    setFormData(prev => ({ ...prev, [captureType]: dataUrl }));
    stopCamera();
};

  const nextStep = () => {
    setCurrentStep(prev => (prev < totalSteps ? prev + 1 : prev));
  };

  const prevStep = () => {
    setCurrentStep(prev => (prev > 1 ? prev - 1 : prev));
  };
  
  const handleRetake = (captureType: string) => {
    setFormData(p => ({...p, [captureType]: ''}));
    getCameraPermission();
  };

  const handleSubmit = async () => {
    if (!user || !firestore) {
        toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to submit.' });
        return;
    }
    setIsSubmitting(true);
    stopCamera();

    try {
        // First, update the user status to 'pending'
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, { status: 'pending' });

        // Then, start the AI decision flow
        const result = await kycDecision({
            userId: user.uid,
            personalInfo: { // This data would now come from the user's Firestore profile
                name: user.displayName || 'N/A',
                email: user.email || 'N/A',
                phone: user.phoneNumber || 'N/A',
                vehicleType: formData.vehicleType,
            },
            documentImages: {
                licenseFront: formData.licenseFront,
                licenseBack: formData.licenseBack,
                registrationFront: formData.registrationFront,
                registrationBack: formData.registrationBack,
                vehiclePhoto: formData.vehiclePhoto,
                facePhoto: formData.facePhoto,
            },
        });

        // The AI flow will trigger a notification, but we don't need to update status here again
        // as the final decision will be made by an admin.

        toast({
            title: `Application Submitted`,
            description: "Your application is now pending review.",
        });

        setCurrentStep(totalSteps + 1); // Move to success screen
    } catch (error) {
        console.error("Error submitting KYC form:", error);
        // If submission fails, revert status to unverified
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, { status: 'unverified' });

        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: "Something went wrong. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    if (isSubmitting) {
        return (
            <div className="text-center flex flex-col items-center gap-4 py-8">
                <Loader2 className="w-16 h-16 text-primary animate-spin"/>
                <h2 className="text-2xl font-bold">Submitting for Review...</h2>
                <p className="text-muted-foreground">Please wait while we process your application. This may take a moment.</p>
            </div>
        )
    }

    if (!activeStep) {
         return (
            <div className="text-center flex flex-col items-center gap-4 py-8">
                <BadgeCheck className="w-16 h-16 text-green-500 bg-green-100 rounded-full p-2"/>
                <h2 className="text-2xl font-bold">Application Submitted!</h2>
                <p className="text-muted-foreground">Thank you for registering. Your application is now pending review. We will notify you once it's complete.</p>
                <Button asChild>
                    <Link href="/rider/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
          );
    }
    
    if (activeStep.id === 1) {
        return (
            <div className="space-y-4 py-8">
                <p className="text-center text-muted-foreground">Please select the type of vehicle you will be using for deliveries.</p>
                <div className='flex justify-center gap-4'>
                     <Button variant={formData.vehicleType === 'motorbike' ? 'default' : 'outline'} size="lg" className="h-24 w-32 flex-col gap-2" onClick={() => setFormData(p => ({...p, vehicleType: 'motorbike'}))}>
                        <Bike className="w-8 h-8"/> Motorbike
                     </Button>
                     <Button variant={formData.vehicleType === 'car' ? 'default' : 'outline'} size="lg" className="h-24 w-32 flex-col gap-2" onClick={() => setFormData(p => ({...p, vehicleType: 'car'}))}>
                        <Car className="w-8 h-8"/> Car
                     </Button>
                </div>
            </div>
        );
    }


    const renderAnimatedSample = (isBack: boolean, type: 'license' | 'vehicle' | 'registration') => {
      let frontImg, backImg;
      if (type === 'license') {
        frontImg = "/images/DL-Front.webp";
        backImg = "/images/DL-Back.PNG";
      } else if (type === 'vehicle') {
        frontImg = formData.vehicleType === 'motorbike' ? "/images/moto.PNG" : "/images/car.PNG";
        backImg = frontImg; // no back for vehicle
      } else { // registration
        frontImg = "/images/R-Front.png";
        backImg = "/images/R-Back.png";
      }

      return (
        <div className="absolute inset-0 backface-hidden">
            <div className={cn(
                "relative w-full h-full transform-style-3d transition-transform duration-700 delay-300",
                isBack && (type === 'license' || type === 'registration') && "[transform:rotateY(180deg)]"
            )}>
              <div className="absolute inset-0 backface-hidden">
                  <Image src={frontImg} alt="Sample front" fill style={{ objectFit: 'contain' }} className="rounded-lg"/>
              </div>
              {(type === 'license' || type === 'registration') && (
                <div className="absolute inset-0 [transform:rotateY(180deg)] backface-hidden">
                    <Image src={backImg} alt="Sample back" fill style={{ objectFit: 'contain' }} className="rounded-lg"/>
                </div>
              )}
            </div>
        </div>
      );
    }

    if (activeStep.captureType && ['licenseFront', 'licenseBack', 'registrationFront', 'registrationBack', 'vehiclePhoto'].includes(activeStep.captureType)) {
      const captureType = activeStep.captureType as 'licenseFront' | 'licenseBack' | 'registrationFront' | 'registrationBack' | 'vehiclePhoto';
      const imageData = formData[captureType];
      const isBack = captureType.includes('Back');
      const isPortrait = ['registrationFront', 'registrationBack'].includes(captureType);

      const docType = captureType.includes('license') ? 'license' : captureType.includes('registration') ? 'registration' : 'vehicle';
      
      let instructionText = "Place the front of your document in the frame.";
      if (docType === 'license') {
        instructionText = isBack ? "Now, capture the back of the license." : "Place the front of your driver's license in the frame.";
      } else if (docType === 'registration') {
        instructionText = isBack ? "Now, capture the back of the registration." : "Place the front of your vehicle registration in the frame.";
      } else if (docType === 'vehicle') {
        instructionText = "Please take a photo of your vehicle exactly as shown in the example. Photos from other angles will not be accepted.";
      }

      return (
        <div className="space-y-4">
          <div className="relative overflow-hidden">
            <div className={cn(
              "transition-all duration-500",
              showSample ? 'opacity-0' : 'opacity-100',
              'h-24 flex items-center justify-center p-2 gap-4'
            )}>
              <p className="text-center text-muted-foreground flex-1">{instructionText}</p>
              <div className="relative w-20 h-20">
                {isBack && (docType === 'license' || docType === 'registration') ? (
                  <div className="relative w-full h-full transform-style-3d transition-transform duration-700 [transform:rotateY(180deg)]">
                    <div className="absolute inset-0 backface-hidden">
                      {docType === 'vehicle' ? (
                        <Image src={formData.vehicleType === 'motorbike' ? '/images/moto.PNG' : '/images/car.PNG'} alt="Sample" fill style={{ objectFit: 'contain' }} className="rounded-lg"/>
                      ) : docType === 'registration' ? (
                        <Image src="/images/R-Front.png" alt="Sample" fill style={{ objectFit: 'contain' }} className="rounded-lg"/>
                      ) : (
                        <Image src="/images/DL-Front.webp" alt="Sample" fill style={{ objectFit: 'contain' }} className="rounded-lg"/>
                      )}
                    </div>
                    <div className="absolute inset-0 [transform:rotateY(180deg)] backface-hidden">
                      {docType === 'registration' ? (
                        <Image src="/images/R-Back.png" alt="Sample back" fill style={{ objectFit: 'contain' }} className="rounded-lg"/>
                      ) : (
                        <Image src="/images/DL-Back.PNG" alt="Sample back" fill style={{ objectFit: 'contain' }} className="rounded-lg"/>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    {docType === 'vehicle' ? (
                      <Image src={formData.vehicleType === 'motorbike' ? '/images/moto.PNG' : '/images/car.PNG'} alt="Sample" fill style={{ objectFit: 'contain' }} className="rounded-lg"/>
                    ) : docType === 'registration' ? (
                      <Image src="/images/R-Front.png" alt="Sample" fill style={{ objectFit: 'contain' }} className="rounded-lg"/>
                    ) : (
                      <Image src="/images/DL-Front.webp" alt="Sample" fill style={{ objectFit: 'contain' }} className="rounded-lg"/>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className={cn(
                "absolute inset-0 flex items-center justify-center p-4 transition-all duration-700 ease-in-out z-10 pointer-events-none",
                showSample ? 'scale-100 opacity-100' : 'scale-[0.25] opacity-0 -translate-y-1/2 translate-x-[90%]'
              )}>
                {renderAnimatedSample(isBack, docType)}
            </div>

            <div className={cn(
                "relative w-full max-w-sm mx-auto bg-muted rounded-md overflow-hidden flex items-center justify-center",
                isPortrait ? 'aspect-[3/4]' : 'aspect-video'
            )}>
                {imageData ? (
                  <Image src={imageData} alt={`${captureType} preview`} fill className="object-contain" />
                ) : (
                    <>
                        <video ref={videoRef} className={cn("w-full h-full object-cover", hasCameraPermission !== true && 'hidden')} autoPlay playsInline muted />
                        {hasCameraPermission === null && <p>Requesting camera access...</p>}
                        {hasCameraPermission === false && <p className="text-muted-foreground p-4 text-center">Camera access is required. Please enable it in your browser settings and refresh the page.</p>}
                    </>
                )}
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-4 justify-center">
            {imageData ? (
                <Button variant="outline" onClick={() => handleRetake(captureType)}>
                    Retake Photo
                </Button>
            ) : (
                <Button onClick={() => handleCapture(captureType)} disabled={hasCameraPermission !== true || showSample}>
                    <Camera className="mr-2" /> Capture
                </Button>
            )}
          </div>
        </div>
      );
    }

    if (activeStep.captureType === 'facePhoto') {
      const captureType = activeStep.captureType;
      const imageData = formData[captureType];
      
      return (
        <div className="space-y-4">
          {hasCameraPermission === false && (
            <Alert variant="destructive">
                <Camera className="h-4 w-4" />
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                Please allow camera access to use this feature. You may need to refresh the page and grant permission.
                </AlertDescription>
            </Alert>
          )}

          <div className="relative aspect-[3/4] w-full max-w-sm mx-auto bg-muted rounded-md overflow-hidden flex items-center justify-center">
            {imageData ? (
              <Image src={imageData} alt={`${captureType} preview`} fill className="object-contain" />
            ) : (
                <>
                    <video 
                      ref={videoRef} 
                      className={cn(
                        "w-full h-full object-cover", 
                        captureType === 'facePhoto' && 'transform -scale-x-100',
                        hasCameraPermission !== true && 'hidden'
                      )} 
                      autoPlay 
                      playsInline 
                      muted 
                    />
                    {captureType === 'facePhoto' && hasCameraPermission === true && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Image src="/images/face.png" alt="Face Overlay" width={300} height={400} className="w-auto h-[80%] opacity-80 scale-110" />
                      </div>
                    )}
                    {hasCameraPermission === null && <p>Requesting camera access...</p>}
                    {hasCameraPermission === false && <p className="text-muted-foreground p-4 text-center">Camera access is required. Please enable it in your browser settings and refresh the page.</p>}
                </>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />

           {!imageData && captureType === 'facePhoto' && (
            <p className="text-center text-sm text-muted-foreground">Position your face inside the frame and take a clear picture.</p>
           )}

          <div className="flex gap-4 justify-center">
            {imageData ? (
                <Button variant="outline" onClick={() => handleRetake(captureType)}>
                    Retake Photo
                </Button>
            ) : (
                <Button onClick={() => handleCapture(captureType)} disabled={hasCameraPermission !== true}>
                    <Camera className="mr-2" /> Capture
                </Button>
            )}
          </div>
        </div>
      );
    }

    return null; // Should not be reached with the new vehicle step
  };

  const canProceed = () => {
    if (!activeStep) return false;

    if (activeStep.id === 1) {
        return !!formData.vehicleType;
    }

    if(activeStep.captureType) {
        return !!formData[activeStep.captureType]
    }
    return false;
  }

  return (
    <div className="space-y-6">
      {currentStep <= totalSteps && !isSubmitting &&(
        <>
            <div className="text-center">
                <h2 className="text-xl font-semibold">{activeStep?.title}</h2>
                <p className="text-muted-foreground">Step {currentStep} of {totalSteps}</p>
            </div>
            <Progress value={progress} className="w-full" />
        </>
      )}
      
      <div>{renderStepContent()}</div>

      {currentStep <= totalSteps && !isSubmitting && (
        <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                <ArrowLeft className="mr-2" /> Previous
            </Button>
            {currentStep === totalSteps ? (
                <Button onClick={handleSubmit} disabled={!canProceed()}>Submit Application</Button>
            ) : (
                <Button onClick={nextStep} disabled={!canProceed()}>Next</Button>
            )}
        </div>
      )}
    </div>
  );
}
